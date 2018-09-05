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
const kue = require('kue')
const queue = kue.createQueue()
const cluster = require('cluster')
const clusterWorkerSize = require('os').cpus().length

cluster.on('exit', function (worker) {
    // Replace the dead worker,
    // we're not sentimental
  console.log('Worker %d died :(', worker.id)
  cluster.fork()
})

queue.process('process', 2, function (job, done) {
  methods.processImage(job.data, done)
        .catch((err) => {
          methods.handleError(err)
        })
})

let app = express()

app.use(express.urlencoded({ extended: false }))
app.use(expressVueMiddleware)
app.use(bodyParser.json())
app.use(express.urlencoded({ extended: false }))
app.use('/assets', express.static('public/assets'))
app.use('/min', express.static('./min'))
app.use(fileUpload())

process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at: Promise', p, 'reason:', reason)
  // application specific logging, throwing an error, or other logic here
})

cron.schedule('0 */12 * * *', () => {
  let files = fs.readdirSync('./min').filter(junk.not)
  let date = Date(Date.now()).toString()

  let message = ''
  message += '\r\n<------------------------------>\r\n'
  message += date + '\r\n'

  if (files.length > 0) {
    message += `Delete old Cron running, deleting ${files.length} files`
    for (let i = 0; i < files.length; i++) {
      message += `\r\nDeleting ${files[i]}`
    }
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

      if (stats.size > 100000) {
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

  methods.deleteOld(files)
})

app.get('/', (req, res) => {
  res.renderVue('home.vue')
})

app.get('/download/:filename', async (req, res) => {
  let dir = req.params.filename
  let created = fs.statSync(`./min/${dir}.zip`).birthtimeMs

  methods.collectFiles(dir)
    .then(function (files) {
      let data = {
        files: files,
        created: created
      }
      return res.renderVue('download.vue', data)
    })
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
  res.download(`./min/${fn}.zip`)
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

  job.on('complete', () => {
    res.redirect(`/download/${id}`)
  }).on('failed', () => {
    res.renderVue('404.vue')
  }).save((err) => {
    if (err) methods.handleError(err)
  })
})

app.get('/404', (req, res) => {
  res.renderVue('404.vue')
})

if (cluster.isMaster) {
  for (var i = 0; i < clusterWorkerSize; i += 1) {
    cluster.fork()
  }
} else {
  console.log('app running')
  app.listen('8888', () => {
  })
}
