const imagemin = require('imagemin')
const imageminPngquant = require('imagemin-pngquant')
const imageminGifsicle = require('imagemin-gifsicle')
const imageminSvgo = require('imagemin-svgo')
// const imageminJpegoptim = require('imagemin-jpegoptim')
const imageminMozjpeg = require('imagemin-mozjpeg')
const Jimp = require('jimp')
const fs = require('fs')
const zipFolder = require('zip-folder')
const triangulate = require('triangulate-image')
const rimraf = require('rimraf')

// parameters used for tessellation. using randomization on accuracy and vertices to make no two tessellated images look the same

function tessellate (buffer) {
  let triangulationParams = {
    accuracy: Math.round(Math.random() * 25) / 100,
    stroke: true,
    strokeWidth: 1,
    blur: 80,
    vertexCount: Math.ceil(Math.random() * 80) + 50
  }

  return triangulate(triangulationParams)
                  .fromBufferSync(buffer)
                  .toJPGStream()
}

function resize (img, size, output) {
  console.log(`we're in the resize function`)
  img.clone()
     .resize(size, Jimp.AUTO)
     .write(output)
}

function generateAsync (directory, filename, option, ext) {
  let fn = `${filename}-original${ext}`
  let output = `${directory}/${filename}-async${ext}`

  return new Promise((resolve, reject) => {
    Jimp.read(`${directory}/${fn}`, (err, img) => {
      if (err) {
        return handleError(err)
      }

      if (option === 'none' || !option) {
        img.clone()
          .resize(960, Jimp.AUTO)
          .quality(50)
          .writeAsync(output)
          .catch((err) => {
            if (err) return handleError(err)
          })
        resolve('done')
      } if (option === 'blur') {
        img.clone()
           .resize(960, Jimp.AUTO)
           .quality(50)
           .blur(15)
           .writeAsync(output)
           .catch((err) => {
             if (err) return handleError(err)
           })
        resolve('done')
      } else if (option === 'pixel') {
        img.clone()
           .resize(960, Jimp.AUTO)
           .quality(50)
           .pixelate(80)
           .writeAsync(output)
           .catch((err) => {
             if (err) return handleError(err)
           })
        resolve('done')
      } else if (option === 'tri') {
        img.clone()
           .resize(960, Jimp.AUTO)
           .quality(50)
           .getBuffer(img.getMIME(), (err, buffer) => {
             return new Promise((resolve, reject) => {
               if (err) return handleError(err)
               let fileStream = fs.createWriteStream(output)
               let jpgStream = tessellate(buffer)
               jpgStream.on('data', function (chunk) { fileStream.write(chunk) })
               jpgStream.on('end', function () {
                 fileStream.end()
               })
             }).then(() => {
               resolve('done')
             }).catch((err) => {
               return handleError(err)
             })
           })
        resolve('done')
      }
    })
  })
}

// resize images that are uploaded. needs to be rewritten

function resizeImages (directory, filename, sizes, ext, id) {
  let sizeOptions = {
    'xsmall': 320,
    'small': 480,
    'medium': 960,
    'large': 1280,
    'retina': 2560
  }

  console.log('resize starting up')
  return Jimp.read(`${directory}/${filename}-original${ext}`)
        .then((img) => {
          console.log('reading width')
          let osize = img.bitmap.width
          console.log('got the width yo')
          console.log(sizes)
          if (sizes) {
            sizes.forEach((size) => {
              console.log('resizing for', size)
              let output = `${directory}/${filename}-${size}${ext}`
              if (osize > sizeOptions[size]) {
                resize(img, sizeOptions[size], output)
              }
            })
          }
        })
        .catch((err) => {
          console.log('WHAT THE INCREDIBLE FUCK')
        })
}

// optimizing images in the temp directory
function optimizeImages (directory, output) {
  console.log('trying optimize')
  return new Promise((resolve, reject) => {
    imagemin([directory + '*.{jpg,png,jpeg,svg,gif}'], output, {
      plugins: [
        imageminMozjpeg({quality: 80}),
        imageminPngquant({quality: '65-80'}),
        imageminGifsicle({interlaced: true, optimizationLevel: 3}),
        imageminSvgo()
      ]
    }).then(() => {
      resolve('done')
    }).catch((err) => {
      return handleError(err)
    })
  })
}

// give it a directory and it removes all files from it. this is specifically for removing all files from the temp directory without actually removing the temp directory. as with everything else, written as a promise so things can be chained and run in sequence instead of simultaneously
function cleanDirectory (directory) {
  return new Promise((resolve, reject) => {
    rimraf(directory, (err) => {
      if (err) { return handleError(err) }

      resolve('done')
    })
  })
}

// zip a directory
function zipDirectory (directory) {
  return new Promise((resolve, reject) => {
    zipFolder(directory, `${directory}.zip`, (err) => {
      if (err) { return handleError(err) } else { resolve('done') }
    })
  })
}

// pretty proud of this one. gets filename, prints out an html snippet with the appropriate markup to use with the async image loading script I wrote concurrently with this project
function printCode (filename, extension, sizes, id) {
  return new Promise((resolve, reject) => {
    let ext = extension
    let fileSource
    let sourceSet = ''
    let fileContents = `<!-- code generated based on file uploaded\r\nremember to update source URL and add an alt tag --> \r\n`
    let o = sizes

    if (o.async) {
      fileSource = `${filename}-async${ext}`
    } else {
      fileSource = `${filename}-original${ext}`
    }

    fileContents += `<img src="/${fileSource}"`

    if (o.xsmall) {
      sourceSet += `/${filename}-xsmall${ext} 320w`
    }

    if (o.small) {
      sourceSet += `,\r\n\t\t `
      sourceSet += `/${filename}-small${ext} 480w`
    }

    if (o.medium) {
      sourceSet += `,\r\n\t\t `
      sourceSet += `/${filename}-medium${ext} 960w`
    }

    if (o.large) {
      sourceSet += `,\r\n\t\t `
      sourceSet += `/${filename}-large${ext} 1280w`
    }

    if (o.retina) {
      sourceSet += `,\r\n\t\t `
      sourceSet += `/${filename}-retina${ext} 2160w`
    }

    fileContents += ` \r\n\t\t data-srcset="${sourceSet}" />`

    fs.writeFileSync(`./min/${id}/codeExample.html`, fileContents, (err) => {
      if (err) { return handleError(err) }
    })

    resolve('done')
  })
}

// writes any errors to the err.log file
function handleError (err) {
  let date = Date.now().toString()
  let error = ''
  console.log('Writing error to file', err, date)
  error += '<------------------------------>\r\n'
  error += date + '\r\n'
  error += err + '\r\n'

  fs.appendFile('./server/logs/err.log', error, (err) => {
    if (err) { return handleError(err) }
    return console.log('Error writing to error log')
  })
}

// deletes any files and directories older than 3 days that are inside the min directory
function deleteOld (files) {
  console.log('cron running')
  if (files.length < 1) {
    return console.log('directory empty')
  }

  for (let i = 0; i < files.length; i++) {
    let mTime = fs.statSync(`./min/${files[i]}`).mtimeMs
    let now = Date.now()

    if ((now - mTime) >= 259200000 && files[i] !== '.DS_Store') {
      rimraf(`./min/${files[i]}`, () => {
        console.log(files[i] + ' deleted')
      })
    }
  }
  console.log('cron finished')
}

module.exports.resizeImages = resizeImages
module.exports.optimizeImages = optimizeImages
module.exports.cleanDirectory = cleanDirectory
module.exports.zipDirectory = zipDirectory
module.exports.printCode = printCode
module.exports.handleError = handleError
module.exports.deleteOld = deleteOld
module.exports.generateAsync = generateAsync
