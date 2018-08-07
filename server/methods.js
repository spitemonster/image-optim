const imagemin = require('imagemin')
const imageminPngquant = require('imagemin-pngquant')
const imageminJpegoptim = require('imagemin-jpegoptim')
const Jimp = require('jimp')
const path = require('path')
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

// resize images that are uploaded. needs to be rewritten

function resizeImages (directory, filename, options, output, extension) {
  let o = options
  let ext = extension
  let fn = filename + '-original.' + ext

  return new Promise((resolve, reject) => {
    Jimp.read(path.join(directory + fn)).then((img) => {
      let width = img.bitmap.width

      // we're resizing top down because it looks like jimp performs resizing on the output of each image (granted I did not test this AFTER I added .clone()) using if statements because a switch would be pointless. there's probaly a way I can refactor this. we're checking to make sure the OG image is wider than the desired value because we don't want jimp to do any upsizing. It probably wouldn't look bad but if the designers wanted a 2560px wide image they'd have made one.

      // retina/2560
      if (o.retina && width >= 2560) {
        img.clone()
           .resize(2560, Jimp.AUTO)
           .write('./uploads/temp/' + filename + '-retina.' + ext)
      }

      // large/1280
      if (o.large && width >= 1280) {
        img.clone()
           .resize(1280, Jimp.AUTO)
           .write('./uploads/temp/' + filename + '-large.' + ext)
      }

      // medium/960
      if (o.medium && width >= 960) {
        img.clone()
           .resize(960, Jimp.AUTO)
           .write('./uploads/temp/' + filename + '-medium.' + ext)
      }

      // small/480
      if (o.small && width >= 480) {
        img.clone()
           .resize(480, Jimp.AUTO)
           .write('./uploads/temp/' + filename + '-small.' + ext)
      }

      // xtra small/320
      if (o.xsmall && width >= 320) {
        img.clone()
           .resize(320, Jimp.AUTO)
           .write('./uploads/temp/' + filename + '-xsmall.' + ext)
      }

      // here's the async crap. all of these are resized to 960 as a nice in between size. not so large that the page weight feels it, but large enough that they'll look good on any screen
      if (o.async === 'on' && o.asyncBlur !== 'on' && !o.asyncShape) {
        // just a low quality image returned
        img.clone()
           .resize(960, Jimp.AUTO)
           .quality(50)
           .write('./uploads/temp/' + filename + '-async.' + ext)
      } else if (o.async === 'on' && o.asyncBlur === 'on' && !o.asyncShape) {
        // low quality and blurred
        img.clone()
           .resize(960, Jimp.AUTO)
           .quality(50)
           .blur(15)
           .write('./uploads/temp/' + filename + '-async.' + ext)
      } else if (o.async === 'on' && o.asyncBlur !== 'on' && o.asyncShape === 'pixel') {
        // low quality and pixellated
        img.clone()
           .resize(960, Jimp.AUTO)
           .quality(50)
           .pixelate(80)
           .write('./uploads/temp/' + filename + '-async.' + ext)
      } else if (o.async === 'on' && o.asyncBlur === 'on' && o.asyncShape === 'pixel') {
        // low quality, blurred and pixellated
        img.clone()
           .resize(960, Jimp.AUTO)
           .quality(50)
           .blur(15)
           .pixelate(80)
           .write('./uploads/temp/' + filename + '-async.' + ext)
      } else if (o.async === 'on' && o.asyncBlur !== 'on' && o.asyncShape === 'tri') {
        // low quality and tessellated
        img.clone()
           .resize(960, Jimp.AUTO)
           .quality(50)
           .getBuffer(img.getMIME(), (err, buffer) => {
             // done as a promise becasue this always finished well after the optimizer ran
             return new Promise((resolve, reject) => {
               if (err) return handleError(err)

               let fileStream = fs.createWriteStream('./uploads/temp/' + filename + '-async.jpg')
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
      } else if (o.async === 'on' && o.asyncBlur === 'on' && o.asyncShape === 'tri') {
        // low quality, blurred and tessellated
        img.clone()
           .resize(960, Jimp.AUTO)
           .quality(50)
           .blur(15)
           .getBuffer(img.getMIME(), (err, buffer) => {
             return new Promise((resolve, reject) => {
               if (err) return handleError(err)

               let fileStream = fs.createWriteStream('./uploads/temp/' + filename + '-async.jpg')
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
      }
    }).then(() => {
      resolve('done')
    })
  })
}

// optimizing images in the temp directory
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
      return handleError(err)
    })
  })
}

// give it a directory and it removes all files from it. this is specifically for removing all files from the temp directory without actually removing the temp directory. as with everything else, written as a promise so things can be chained and run in sequence instead of simultaneously
function cleanDirectory (directory) {
  return new Promise((resolve, reject) => {
    fs.readdir(directory, (err, files) => {
      if (err) return handleError(err)

      for (const file of files) {
        fs.unlink(path.join(directory, file), err => {
          if (err) return handleError(err)
        })
      }
      resolve('done')
    })
  })
}

// zip a directory
function zipDirectory (directory, res) {
  return new Promise((resolve, reject) => {
    zipFolder(directory, directory + '.zip', (err) => {
      if (err) { return handleError(err) } else { resolve('done') }
    })
  })
}

// pretty proud of this one. gets filename, prints out an html snippet with the appropriate markup to use with the async image loading script I wrote concurrently with this project
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
      if (err) { return handleError(err) }
    })

    resolve('done')
  })
}

// writes any errors to the err.log file
function handleError (err) {
  let errStream = fs.createWriteStream('./server/logs/err.log')
  let date = Date.now().toString()
  console.log('Writing error to file', err, date)
  errStream.write('<------------------------------>\r\n')
  errStream.write(date + '\r\n')
  errStream.write(err + '\r\n')
}

// deletes any files and directories older than 3 days that are inside the min directory
function deleteOld (files) {
  console.log('cron running')
  if (files.length < 1) {
    return console.log('directory empty')
  }

  for (let i = 0; i < files.length; i++) {
    let mTime = fs.statSync('./min/' + files[i]).mtimeMs
    let now = Date.now()

    if ((now - mTime) >= 259200000 && files[i] !== '.DS_Store') {
      rimraf(path.join('./min/' + files[i]), () => {
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
