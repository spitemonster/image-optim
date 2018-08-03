// const sharp = require('sharp')
const imagemin = require('imagemin')
const imageminPngquant = require('imagemin-pngquant')
const imageminJpegoptim = require('imagemin-jpegoptim')
const Jimp = require('jimp')
const path = require('path')
const fs = require('fs')
const zipFolder = require('zip-folder')
const triangulate = require('triangulate-image')

function resizeImages (directory, filename, options, output, extension) {
  let o = options
  let ext = extension
  let fn = filename + '-original.' + ext

  return new Promise((resolve, reject) => {
    Jimp.read(directory + fn).then((img) => {
      let width = img.bitmap.width

      if (o.retina && width >= 2560) {
        img.clone()
           .resize(2560, Jimp.AUTO)
           .write('./uploads/temp/' + filename + '-retina.' + ext)
      }

      if (o.large && width >= 1280) {
        img.clone()
           .resize(1280, Jimp.AUTO)
           .write('./uploads/temp/' + filename + '-large.' + ext)
      }

      if (o.medium && width >= 960) {
        img.clone()
           .resize(960, Jimp.AUTO)
           .write('./uploads/temp/' + filename + '-medium.' + ext)
      }

      if (o.small && width >= 480) {
        img.clone()
           .resize(480, Jimp.AUTO)
           .write('./uploads/temp/' + filename + '-small.' + ext)
      }

      if (o.xsmall && width >= 320) {
        img.clone()
           .resize(320, Jimp.AUTO)
           .write('./uploads/temp/' + filename + '-xsmall.' + ext)
      }

      if (o.async === 'on' && o.asyncBlur !== 'on' && !o.asyncShape) {
        img.clone()
           .resize(960, Jimp.AUTO)
           .quality(50)
           .write('./uploads/temp/' + filename + '-async.' + ext)
      } else if (o.async === 'on' && o.asyncBlur === 'on' && !o.asyncShape) {
        img.clone()
           .resize(960, Jimp.AUTO)
           .quality(50)
           .blur(15)
           .write('./uploads/temp/' + filename + '-async.' + ext)
      } else if (o.async === 'on' && o.asyncBlur !== 'on' && o.asyncShape === 'pixel') {
        img.clone()
           .resize(960, Jimp.AUTO)
           .quality(50)
           .pixelate(80)
           .write('./uploads/temp/' + filename + '-async.' + ext)
      } else if (o.async === 'on' && o.asyncBlur === 'on' && o.asyncShape === 'pixel') {
        img.clone()
           .resize(960, Jimp.AUTO)
           .quality(50)
           .blur(15)
           .pixelate(80)
           .write('./uploads/temp/' + filename + '-async.' + ext)
      } else if (o.async === 'on' && o.asyncBlur !== 'on' && o.asyncShape === 'tri') {
        img.clone()
           .resize(960, Jimp.AUTO)
           .quality(50)
           .getBuffer(img.getMIME(), (err, buffer) => {
             return new Promise((resolve, reject) => {
               let triangulationParams = {
                 accuracy: 0.1,
                 stroke: true,
                 strokeWidth: 1,
                 blur: 80,
                 vertexCount: 100
               }

               if (err) return console.log(err)

               let fileStream = fs.createWriteStream('./uploads/temp/' + filename + '-async.jpg')
               let jpgStream = triangulate(triangulationParams)
                               .fromBufferSync(buffer)
                               .toJPGStream()

               jpgStream.on('data', function (chunk) { fileStream.write(chunk) })
               jpgStream.on('end', function () {
                 fileStream.end()
               })
             }).then(() => {
               resolve('done')
             }).catch((err) => {
               throw err
             })
           })
      } else if (o.async === 'on' && o.asyncBlur === 'on' && o.asyncShape === 'tri') {
        img.clone()
           .resize(960, Jimp.AUTO)
           .quality(50)
           .blur(15)
           .getBuffer(img.getMIME(), (err, buffer) => {
             return new Promise((resolve, reject) => {
               let triangulationParams = {
                 accuracy: 0.1,
                 stroke: true,
                 strokeWidth: 1,
                 blur: 80,
                 vertexCount: 100
               }

               if (err) return console.log(err)

               let fileStream = fs.createWriteStream('./uploads/temp/' + filename + '-async.jpg')
               let jpgStream = triangulate(triangulationParams)
                               .fromBufferSync(buffer)
                               .toJPGStream()

               jpgStream.on('data', function (chunk) { fileStream.write(chunk) })
               jpgStream.on('end', function () {
                 fileStream.end()
               })
             }).then(() => {
               resolve('done')
             }).catch((err) => {
               throw err
             })
           })
      }
    }).then(() => {
      resolve('done')
    })
  })
}

function optimizeImages (directory, output) {
  return new Promise((resolve, reject) => {
    imagemin([directory + '*.{jpg,png}'], output, {
      plugins: [
        imageminJpegoptim({max: 95}),
        imageminPngquant({quality: '65-80'})
      ]
    }).then(() => {
      resolve('done')
    }).catch((err) => {
      return console.log(err)
    })
  })
}

function cleanDirectory (directory) {
  return new Promise((resolve, reject) => {
    fs.readdir(directory, (err, files) => {
      if (err) return console.log(err)

      for (const file of files) {
        fs.unlink(path.join(directory, file), err => {
          if (err) throw err
        })
      }

      resolve('done')
    })
  })
}

function zipDirectory (directory, res) {
  return new Promise((resolve, reject) => {
    zipFolder(directory, directory + '.zip', (err) => {
      if (err) { return console.log(err) } else { resolve('done') }
    })
  })
}

function printCode (filename, extension, options) {
  return new Promise((resolve, reject) => {
    let o = options
    let ext = extension
    let fileSource
    let sourceSet = ''
    let fileContents = `<!-- code generated based on file uploaded\r\nremember to update source URL and add an alt tag --> \r\n`

    if (o.async) {
      fileSource = filename + '-async.' + ext
    } else {
      fileSource = filename + '-original.' + ext
    }

    fileContents += `<img src="/${fileSource}"`

    if (o.xsmall) {
      sourceSet += `/${filename}-xsmall.${ext} 320w`
    }

    if (o.small) {
      sourceSet += `,\r\n\t\t `
      sourceSet += `/${filename}-small.${ext} 480w`
    }

    if (o.medium) {
      sourceSet += `,\r\n\t\t `
      sourceSet += `/${filename}-medium.${ext} 960w`
    }

    if (o.large) {
      sourceSet += `,\r\n\t\t `
      sourceSet += `/${filename}-large.${ext} 1280w`
    }

    if (o.retina) {
      sourceSet += `,\r\n\t\t `
      sourceSet += `/${filename}-retina.${ext} 2160w`
    }

    fileContents += ` \r\n\t\t data-srcset="${sourceSet}" />`

    fs.writeFileSync('./min/' + filename + '/codeExample.html', fileContents, (err) => {
      if (err) { return console.log(err) }
    })

    resolve('done')
  })
}

module.exports.resizeImages = resizeImages
module.exports.optimizeImages = optimizeImages
module.exports.cleanDirectory = cleanDirectory
module.exports.zipDirectory = zipDirectory
module.exports.printCode = printCode
