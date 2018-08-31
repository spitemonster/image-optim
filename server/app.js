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

cron.schedule('5 * * * *', () => {
  let files = fs.readdirSync('./min').filter(junk.not)
  let date = Date(Date.now()).toString()

  let message = ''
  message += '\r\n<------------------------------>\r\n'
  message += date + '\r\n'

  if (files.length > 0) {
    message += `Delete old Cron running, deleting ${files.length} files`
  } else {
    message += `Delete old Cron running, no files to delete`
  }

  if (!fs.existsSync(`./server/logs/cron.log`)) {
    fs.writeFile(`./server/logs/cron.log`, message, (err) => {
      if (err) { methods.handleError(err); return console.log('Error writing to error log') }
    })
  } else {
    fs.stat(`./server/logs/cron.log`, (err, stats) => {
      if (err) {
        if (err) { methods.handleError(err); return console.log('Error writing to error log') }
      }

      if (stats.size > 10000) {
        fs.writeFile(`./server/logs/cron.log`, message, (err) => {
          if (err) { methods.handleError(err); return console.log('Error writing to error log') }
        })
      } else {
        fs.appendFile('./server/logs/cron.log', message, (err) => {
          if (err) { methods.handleError(err); return console.log('Error writing to error log') }
        })
      }
    })
  }

  console.log('cron running')
  methods.deleteOld(files)
  console.log('cron finished')
})

app.get('/', (req, res) => {
  res.renderVue('home.vue')
})

app.get('/download/:filename', async (req, res) => {
  let dir = req.params.filename

  methods.collectFiles(dir)
    .then(function (data) { return res.renderVue('download.vue', data) })
    .catch((err) => {
      let errorData = {
        message: '',
        statusCode: 404,
        type: 'Failure'
      }

      if (err.syscall === 'scandir' && err.code === 'ENOENT') {
        errorData.message = 'It appears this directory has expired, please upload your images again.'
      } else {
        errorData.message = 'There was an issue collecting your files. Please try again.'
      }

      res.status(errorData.statusCode).renderVue('404.vue', errorData)
    })
})

app.get('/download/:filename/zip', (req, res) => {
  let fn = req.params.filename
  methods.zipDirectory(`./min/${fn}`).then(() => {
    res.download(`./min/${fn}.zip`)
  })
})

app.get('/download/async.js', (req, res) => {
  res.download(`./public/assets/scripts/async.js`)
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
        res.status(err.statusCode).renderVue('404.vue', err)
      })
  } else if (req.body.async !== 'on' && ext !== '.svg') {
    methods.resizeImages(id, fileName, sizes, ext)
      .then(function () { return methods.optimizeImages(id) })
      .then(function () { return methods.cleanDirectory(tempPath) })
      .then(function () { return methods.printCode(fileName, ext, options, id) })
      .then(function () { return methods.zipDirectory(`./min/${id}`) })
      .then(function () { return res.redirect(`/download/${id}`) })
      .catch((err) => {
        res.status(err.statusCode).renderVue('404.vue', err)
      })
  } else if (ext === '.svg') {
    methods.optimizeImages(id)
      .then(function () { return methods.printCode(fileName, ext, options, id) })
      .then(function () { return methods.cleanDirectory(tempPath) })
      .then(function () { return methods.zipDirectory(`./min/${id}`) })
      .then(res.redirect(`/download/${id}`))
      .catch((err) => {
        res.status(err.statusCode).renderVue('404.vue', err)
      })
  }
})

app.get('/404', (req, res) => {
  res.renderVue('404.vue')
})

app.listen('8888', () => {
  console.log('Listening on port 8888')
})
