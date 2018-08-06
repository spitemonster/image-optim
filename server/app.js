const express = require('express')
// const Vue = require('Vue')
const fs = require('fs')
const fileUpload = require('express-fileupload')
const bodyParser = require('body-parser')
const expressVue = require('express-vue')
const methods = require('./methods.js')
// const cron = require('node-cron')
const util = require('util')
const path = require('path')

const vueOptions = {
  rootPath: 'views',
  head: {
    styles: [{ style: '/assets/style/css/master.min.css' }]
  }
}

const expressVueMiddleware = expressVue.init(vueOptions)

let fileName

let app = express()

app.use(express.urlencoded({ extended: false }))
app.use(expressVueMiddleware)
app.use(bodyParser.json())
app.use(express.urlencoded({ extended: false }))
app.use('/assets', express.static('public/assets'))
app.use('/min', express.static('./min'))
app.use(fileUpload())

app.get('/', (req, res) => {
  res.renderVue('home.vue')
})

app.get('/wait', (req, res) => {
  res.renderVue('wait.vue')
})

app.get('/download/:filename', (req, res) => {
  let dir = req.params.filename
  let data = {
    filename: req.params.filename,
    zipUrl: '/min/' + dir + '.zip',
    files: []
  }
  let files = fs.readdirSync('./min/' + dir + '/')

  console.log(files)

  for (let i = 0; i < files.length; i++) {
    if (path.extname(files[i]) !== '.html') {
      data.files.push('/min/' + dir + '/' + files[i])
    }
  }

  res.renderVue('download.vue', data)
})

app.get('/download/:filename/zip', (req, res) => {
  let fn = req.params.filename

  res.download('./min/' + fn + '.zip')
})

app.post('/upload', (req, res) => {
  fileName = req.body.outPutName ? req.body.outPutName : req.files.inputImage.name
  let filename = req.files.inputImage.name
  let ext = filename.split('.')[filename.split('.').length - 1]
  let options = req.body

  fs.writeFileSync('./uploads/temp/' + fileName + '-original.' + ext, req.files.inputImage.data, (err) => {
    if (err) throw err
  })

  methods
    .resizeImages('./uploads/temp/', fileName, options, './uploads/temp/', ext)
    .then(() => {
      methods.optimizeImages('./uploads/temp/', './min/' + fileName)
      .then(() => {
        methods.printCode(fileName, ext, options)
        methods.cleanDirectory('./uploads/temp')
        .then(() => {
          methods.zipDirectory('./min/' + fileName, res)
        }).then(() => {
          res.redirect('/download/' + fileName)
        })
      })
    }).catch((err) => {
      return console.log(err)
    })

  // setTimeout(() => {
  //   methods.cleanDirectory('./min/' + fileName)
  //     .then(() => {
  //       fs.rmdir('./min/' + fileName, (err) => {
  //         if (err) return console.log(err)
  //       })
  //     })
  //     .then(() => {
  //       fs.unlink('./min/' + fileName + '.zip', (err) => {
  //         if (err) return console.log(err)
  //       })
  //     })
  // }, 30000)
})

app.listen('8888', () => {
  console.log('Listening on port 8888')
})
