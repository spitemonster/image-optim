const express = require('express')
const fs = require('fs')
const fileUpload = require('express-fileupload')
const bodyParser = require('body-parser')
const expressVue = require('express-vue')
const methods = require('./methods.js')
const cron = require('node-cron')
const path = require('path')
const randomstring = require('randomstring')
const validator = require('validator')
const vueOptions = {
  rootPath: 'views',
  head: {
    styles: [{ style: '/assets/style/css/master.min.css' }],
    scripts: [{ src: 'https://unpkg.com/axios/dist/axios.min.js' }]
  }
}
const expressVueMiddleware = expressVue.init(vueOptions)
const kue = require('kue')
const queue = kue.createQueue()
const cluster = require('cluster')
const clusterWorkerSize = require('os').cpus().length

cluster.on('exit', function (worker) {
  cluster.fork()
})

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

app.get('/download/:id', async (req, res) => {
  let id = req.params.id
  let data = {
    id: id
  }

  if (!fs.existsSync(`./min/${id}`)) {
    let errorData = {
      statusCode: 404,
      message: 'It looks like the file you uploaded has expired. Please upload your image and try again.'
    }

    return res.renderVue('404.vue', errorData)
  }

  res.renderVue('download.vue', data)
})

app.get('/download/:id/zip', (req, res) => {
  let id = req.params.filename
  res.download(`./min/${id}.zip`)
})

app.get('/test/:id', (req, res) => {
  let id = req.params.id

  if (fs.existsSync(`./min/${id}.zip`)) {
    let created = fs.statSync(`./min/${id}.zip`).birthtimeMs

    methods.collectFiles(id)
      .then(function (files) {
        let data = {
          files: files,
          created: created
        }
        res.status(200).send(data)
      })
  } else {
    res.status(202).send(`Doesn't`)
  }
})

app.get('/download/async.js', (req, res) => {
  res.download(`./public/assets/scripts/async.js`)
})

app.post('/upload', (req, res) => {
  let fileName = req.body.outPutName
                 ? validator.blacklist(req.body.outPutName, './')
                 : req.files.inputImage.name.split('.')[0]
  let ext = path.extname(req.files.inputImage.name)
  let id = randomstring.generate(12)
  let imageData = req.files.inputImage.data

  fs.mkdirSync(`./uploads/temp/${id}`)
  fs.mkdirSync(`./min/${id}`)
  fs.writeFileSync(`./uploads/temp/${id}/${fileName}-original${ext}`, imageData, (err) => {
    if (err) return methods.handleError(err)
  })

  let job = queue.create('process', {
    uuid: id,
    fileName: fileName,
    ext: ext,
    sizes: req.body.sizes,
    imageData: req.files.inputImage.data,
    async: req.body.async,
    shape: req.body.asyncShape
  })

  job.on('failed', () => {
    let errorData = {
      statusCode: 500,
      message: 'There was an error processing your file. Please try again.'
    }
    res.renderVue('404.vue', errorData)
  }).save((err) => {
    if (err) methods.handleError(err)
  })

  res.redirect(`/download/${id}`)
})

app.get('/404', (req, res) => {
  res.renderVue('404.vue')
})

if (cluster.isMaster) {
  app.listen('8888')
  cron.schedule('0 */12 * * *', () => {
    methods.deleteOld(`./min`)
  })

  for (var i = 0; i < clusterWorkerSize; i += 1) {
    cluster.fork()
  }
} else {
  queue.process('process', 2, function (job, done) {
    methods.processImage(job.data, done)
          .catch((err) => {
            methods.handleError(err)
          })
  })
}
