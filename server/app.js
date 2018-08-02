const express = require('express')
// const Vue = require('Vue')
const fs = require('fs')
const fileUpload = require('express-fileupload')
const bodyParser = require('body-parser')
const expressVue = require('express-vue')
const methods = require('./methods.js')

const vueOptions = {
  rootPath: 'views',
  head: {
    styles: [{ style: 'assets/rendered/style.css' }]
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
app.use(fileUpload())

app.get('/', (req, res) => {
  res.renderVue('home.vue')
})

app.get('/wait', (req, res) => {
  let data = {
    filename: req.query.name,
    files: fs.readdirSync('./min/' + req.query.name)
  }

  res.renderVue('wait.vue', data)
})

app.get('/download', (req, res) => {
  res.download('./min/' + fileName + '.zip', () => {
    methods.cleanDirectory('./uploads/temp/')
           .then(methods.cleanDirectory('./min/' + fileName)
                        .then(() => {
                          fs.rmdir('./min/' + fileName, (err) => {
                            if (err) return console.log(err)
                          })
                        })
                        .then(() => {
                          fs.unlink('./min/' + fileName + '.zip', (err) => {
                            if (err) return console.log(err)
                          })
                        })
                        .catch((err) => { return console.log(err) }))
  })
})

app.post('/upload', (req, res) => {
  fileName = req.body.outPutName ? req.body.outPutName : 'image'
  let filename = req.files.inputImage.name
  let ext = filename.split('.')[filename.split('.').length - 1]
  let options = req.body
  console.log(options.asyncBlur)

  fs.writeFileSync('./uploads/temp/' + fileName + '-original.' + ext, req.files.inputImage.data, (err) => {
    if (err) throw err
  })

  methods
    .resizeImages('./uploads/temp/', fileName, options, './uploads/temp/', ext)
    .then(() => {
      methods.optimizeImages('./uploads/temp/', './min/' + fileName)
      .then(() => {
        methods.printCode(fileName, ext, options)
        .then(() => {
          methods.zipDirectory('./min/' + fileName, res)
        })
      })
    }).catch((err) => {
      return console.log(err)
    })

  res.redirect('/wait?name=' + fileName + '&ext=' + ext)
})

app.listen('8888', () => {
  console.log('Listening on port 8888')
})
