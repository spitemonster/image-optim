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

cron.schedule('* * * 12 * *', () => {
  let files = fs.readdirSync('./min').filter(junk.not)
  methods.deleteOld(files)
})

app.get('/', (req, res) => {
  res.renderVue('home.vue')
})

app.get('/wait', (req, res) => {
  res.renderVue('wait.vue')
})

app.get('/download/:filename', (req, res) => {
  let dir = req.params.filename
  let data = {
    filename: '',
    zipUrl: `/download/${dir}/zip`,
    files: {
    },
    code: '',
    original: ''
  }

  let files = fs.readdirSync(path.join('./min', dir))
  if (fs.existsSync(`./min/${dir}/codeExample.html`)) {
    data.code = fs.readFileSync(`./min/${dir}/codeExample.html`, {encoding: 'utf8'})
  }

  for (let i = 0; i < files.length; i++) {
    if (path.extname(files[i]) !== '.html') {
      let filename = files[i].split('-')
      let size = filename.pop().split('.')[0]
      data.filename = filename.join('-')
      data.files[size] = `/min/${dir}/${files[i]}`

      if (size === 'original') {
        data.original = `/min/${dir}/${files[i]}`
      }
    }
  }
  res.renderVue('download.vue', data)
})

app.get('/download/:filename/zip', (req, res) => {
  let fn = req.params.filename
  res.download(`./min/${fn}.zip`)
})

app.post('/upload', (req, res) => {
  let fileName = req.body.outPutName ? req.body.outPutName : req.files.inputImage.name.split('.')[0]
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

  console.log(sizes)

  fs.mkdirSync(tempPath)

  fs.writeFileSync(`${tempPath}/${fileName}-original${ext}`, req.files.inputImage.data, (err) => {
    if (err) return methods.handleError(err)
  })

  if (req.body.async === 'on' && ext !== '.svg') {
    options['async'] = true
    methods.resizeImages(tempPath, fileName, sizes, ext)
           .then(() => {
             methods.generateAsync(tempPath, fileName, req.body.asyncShape, ext)
               .then(() => {
                 methods.optimizeImages(`${tempPath}/`, path.join('./min/', id))
                 .then(() => {
                   methods.printCode(fileName, ext, options, id)
                   methods.cleanDirectory(tempPath)
                   .then(() => {
                     methods.zipDirectory(`./min/${id}`)
                   }).then(() => {
                     res.redirect(`/download/${id}`)
                   })
                 })
               })
           }).catch(() => {
             res.status(400)
             res.redirect('/404')
           })
  } else if (req.body.async !== 'on' && ext !== '.svg') {
    methods.resizeImages(tempPath, fileName, sizes, ext)
      .then(methods.optimizeImages.bind(`${tempPath}/`, path.join('./min/', id)))
      .then(() => {
        console.log('redirecting')
        // methods.printCode(fileName, ext, options, id)
        // methods.cleanDirectory(tempPath)
        res.redirect(`/download/${id}`)
        console.log('redirected')
      }).catch(() => {
        res.status(400)
        res.redirect('/404')
        console.log('maybe somethings working')
      })
  } else if (ext === '.svg') {
    console.log('svg')
    console.log(ext)
    methods.optimizeImages(`${tempPath}/`, path.join('./min/', id))
    .then(() => {
      // methods.printCode(fileName, ext, options, id)
      methods.cleanDirectory(tempPath)
      .then(() => {
        methods.zipDirectory(`./min/${id}`)
      }).then(() => {
        res.redirect(`/download/${id}`)
      })
    }).catch(() => {
      res.status(400)
      res.redirect('/404')
    })
  }
})

app.get('/404', (req, res) => {
  res.send('404')
})

app.listen('8888', () => {
  console.log('Listening on port 8888')
})
