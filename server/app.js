const express = require('express')
const fs = require('fs')
const fileUpload = require('express-fileupload')
const bodyParser = require('body-parser')
const expressVue = require('express-vue')
const methods = require('./methods.js')
const cron = require('node-cron')
const path = require('path')
const junk = require('junk')
const randomstring = require('randomstring')
const validator = require('validator')
const vueOptions = {
  rootPath: 'views',
  head: {
    styles: [{ style: '/assets/style/css/master.min.css' }]
  }
}
const expressVueMiddleware = expressVue.init(vueOptions)
let app = express()

app.use(express.urlencoded({ extended: false }))
app.use(expressVueMiddleware)
app.use(bodyParser.json())
app.use(express.urlencoded({ extended: false }))
app.use('/assets', express.static('public/assets'))
app.use('/min', express.static('./min'))
app.use(fileUpload())

cron.schedule('* * * * 12 *', () => {
  let files = fs.readdirSync('./min').filter(junk.not)
  console.log('cron running')
  methods.deleteOld(files)
  console.log('cron finished')
})

app.get('/', (req, res) => {
  res.renderVue('home.vue')
})

app.get('/wait', (req, res) => {
  res.renderVue('wait.vue')
})

app.get('/download/:filename', async (req, res) => {
  let dir = req.params.filename

  methods.collectFiles(dir)
    .then(function (data) { return res.renderVue('download.vue', data) })
    .catch((err) => {
      let data = {
        errMessage: err
      }
      res.renderVue('404.vue', data)
    })
})

app.get('/download/:filename/zip', (req, res) => {
  let fn = req.params.filename
  methods.zipDirectory(`./min/${fn}`).then(() => {
    res.download(`./min/${fn}.zip`)
  })
})

app.post('/upload', (req, res) => {
  let fileName = req.body.outPutName
                 ? validator.blacklist(req.body.outPutName, './')
                 : req.files.inputImage.name.split('.')[0]
  let ext = path.extname(req.files.inputImage.name)
  let sizes = []
  let options = {}
  let id = randomstring.generate(12)
  let tempPath = path.join('./uploads/temp/', id)

  if (!req.body.sizes) {
    sizes = [null]
  } else if (typeof req.body.sizes === 'string') {
    sizes.push(req.body.sizes)
    options[sizes[0]] = true
  } else {
    sizes = req.body.sizes

    for (let i = 0; i < sizes.length; i++) {
      options[sizes[i]] = true
    }
  }

  fs.mkdirSync(tempPath)
  fs.mkdirSync(`./min/${id}`)

  fs.writeFileSync(`${tempPath}/${fileName}-original${ext}`, req.files.inputImage.data, (err) => {
    if (err) return methods.handleError(err)
  })

  if (req.body.async === 'on' && ext !== '.svg') {
    options['async'] = true
    methods.resizeImages(id, fileName, sizes, ext)
      .then(function () { return methods.generateAsync(tempPath, fileName, req.body.asyncShape, ext) })
      .then(function () { return methods.optimizeImages(id) })
      .then(function () { return methods.printCode(fileName, ext, options, id) })
      .then(function () { return methods.cleanDirectory(tempPath) })
      .then(function () { return methods.zipDirectory(`./min/${id}`) })
      .then(function () { return res.redirect(`/download/${id}`) })
      .catch((err) => {
        let data = err
        res.renderVue('404.vue', data)
      })
  } else if (req.body.async !== 'on' && ext !== '.svg') {
    methods.resizeImages(id, fileName, sizes, ext)
      .then(function () { return methods.optimizeImages(id) })
      .then(function () { return methods.printCode(fileName, ext, options, id) })
      .then(function () { return methods.cleanDirectory(tempPath) })
      .then(function () { return methods.zipDirectory(`./min/${id}`) })
      .then(function () { return res.redirect(`/download/${id}`) })
      .catch((err) => {
        let data = err
        if (data.type === 'Proceed') {
          methods.handleError(err)
        } else {
          res.status(400).renderVue('404.vue', data)
        }
      })
  } else if (ext === '.svg') {
    methods.optimizeImages(id)
      .then(function () { return methods.printCode(fileName, ext, options, id) })
      .then(function () { return methods.cleanDirectory(tempPath) })
      .then(function () { return methods.zipDirectory(`./min/${id}`) })
      .then(res.redirect(`/download/${id}`))
      .catch((err) => {
        let data = {
          errMessage: err
        }
        res.renderVue('404.vue', data)
      })
  }
})

app.get('/404', (req, res) => {
  res.send('404')
})

app.listen('8888', () => {
  console.log('Listening on port 8888')
})
