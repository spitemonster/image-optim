const imagemin = require('imagemin')
const imageminPngquant = require('imagemin-pngquant')
const imageminGifsicle = require('imagemin-gifsicle')
const imageminSvgo = require('imagemin-svgo')
const path = require('path')
const imageminMozjpeg = require('imagemin-mozjpeg')
const Jimp = require('jimp')
const fs = require('fs')
const zipFolder = require('zip-folder')
const triangulate = require('triangulate-image')
const rimraf = require('rimraf')
const sizeOf = require('image-size')

// BEGIN UTILITY FUNCTIONS
// none of these functions are exported

// tessellation function
function tessellate (buffer) {
  // params. randomly generates accuracy and vertex count to ensure no two tessellations are the same
  let triangulationParams = {
    accuracy: Math.round(Math.random() * 25) / 100,
    stroke: true,
    strokeWidth: 1,
    blur: 80,
    vertexCount: Math.ceil(Math.random() * 80) + 50
  }

  // return this function to make it a bit easier to deal with later
  return triangulate(triangulationParams)
                  .fromBufferSync(buffer)
                  .toJPGStream()
}

// resize function. not much to see hwere
function resize (img, size, output) {
  img.clone()
     .resize(size, Jimp.AUTO)
     .write(output)
}

// drops quality of image and returns the promise
function dropQuality (img) {
  return img.clone()
    .resize(960, Jimp.AUTO)
    .quality(50)
}

// refactored version of the generate async function. way more efficient in terms of lines, less repetition
function makeAsync (img, option, output) {
  if (option === 'none') {
    return dropQuality(img)
              .writeAsync(output)
  } else if (option === 'blur') {
    return dropQuality(img)
              .blur(15)
              .writeAsync(output)
  } else if (option === 'pixel') {
    return dropQuality(img)
              .pixelate(80)
              .writeAsync(output)
  } else if (option === 'tri') {
    return dropQuality(img)
              .getBuffer(img.getMIME(), (err, buffer) => {
                return new Promise((resolve, reject) => {
                  if (err) return handleError(err)
                  let fileStream = fs.createWriteStream(output)
                  let jpgStream = tessellate(buffer)
                  jpgStream.on('data', function (chunk) { fileStream.write(chunk) })
                  jpgStream.on('end', function () {
                    fileStream.end()
                  })
                  resolve('done')
                })
              })
  }
}

// calculates filesize in KB, MB and GB, rounded up to the nearest whole for KB and to one decimal place for MB and GB. Hopefully never gb but rather have it and not need it
function calculateFileSize (sizeInBytes) {
  let size
  if (sizeInBytes < 1000000) {
    let kb = Math.round(sizeInBytes / 1000)
    size = `${kb}kb`
  } else if (sizeInBytes >= 1000000) {
    let mb = Math.round((sizeInBytes / 1000000) * 10) / 10
    size = `${mb}mb`
  } else if (sizeInBytes >= 1000000000) {
    let gb = Math.round((sizeInBytes / 1000000000) * 10) / 10
    size = `${gb}gb`
  }
  return size
}

// BEGIN EXPORT METHODS
function validateFile (filepath) {
  return new Promise((resolve, reject) => {
    fs.stat(filepath, (err, stats) => {
      if (err) return handleError(err)

      if (stats.size > 20000000) {
        let error = new Error('File is too big')
        reject(error)
      } else {
        resolve('done')
      }
    })
  })
}
// async function. as it stands, if statements galore. would like to NOT but not sure how I can
function generateAsync (directory, filename, option, ext) {
  let fn = `${filename}-original${ext}`
  let output = `${directory}/${filename}-async${ext}`

  return new Promise((resolve, reject) => {
    Jimp.read(`${directory}/${fn}`, (err, img) => {
      if (err) {
        handleError(err)
        throw Error(err)
      }

      makeAsync(img, option, output)
      resolve('done')
    }).catch((err) => {
      let errorData = {
        statusCode: 500,
        message: 'There was an error creating an asychronous version of your image. Please try again.',
        type: 'Failure'
      }
      handleError(err)
      reject(errorData)
    })
  })
}

// resize images that are uploaded
function resizeImages (id, filename, sizes, ext) {
  let sizeOptions = {
    'xsmall': 320,
    'small': 480,
    'medium': 960,
    'large': 1280,
    'retina': 2560
  }

  let directory = `./uploads/temp/${id}`

  return new Promise((resolve, reject) => {
    Jimp.read(`${directory}/${filename}-original${ext}`)
      .then((img) => {
        let osize = img.bitmap.width
        if (sizes) {
          sizes.forEach((size) => {
            let output = `${directory}/${filename}-${size}${ext}`
            if (osize > sizeOptions[size]) {
              resize(img, sizeOptions[size], output)
            }
          })
          resolve(id)
        }
      }).catch((err) => {
        handleError(err)
        let errorData = {
          message: `We're having trouble reading the file you uploaded. Please confirm the file is not corrupted and try again.`,
          statusCode: 415,
          type: 'Failure'
        }
        cleanDirectory(directory)
        cleanDirectory(`./min/${id}`)
        reject(errorData)
      })
  })
}

// optimizing images in the temp directory
function optimizeImages (id) {
  return new Promise((resolve, reject) => {
    imagemin([`./uploads/temp/${id}/` + '*.{jpg,png,jpeg,svg,gif}'], `./min/${id}/`, {
      plugins: [
        imageminMozjpeg({quality: 80}),
        imageminPngquant({quality: '65-80'}),
        imageminGifsicle({interlaced: true, optimizationLevel: 3}),
        imageminSvgo()
      ]
    }).then(function () {
      resolve('done')
    }).catch((err) => {
      handleError(err)
      let errorData = {
        message: 'There was an issue optimizing your images. Please re-upload your file and try again.',
        statusCode: 500,
        type: 'Failure'
      }
      cleanDirectory(`./uploads/temp/${id}`)
      cleanDirectory(`./min/${id}`)
      reject(errorData)
    })
  })
}

// reads given directory, gets all of the files from that directory and gets filesize, url, name, etc, and returns it to render function
function collectFiles (dir) {
  return new Promise((resolve, reject) => {
    let data = {
      filename: '',
      zipUrl: `/download/${dir}/zip`,
      files: {
      },
      code: '',
      original: ''
    }
    // probably an inefficient way to do this, but we read the target directory and return an array of all of the files in that directory

    let files = fs.readdirSync(`./min/${dir}`)
    if (files.length < 1) {
      throw Error('Directory is empty')
    }

    if (fs.existsSync(`./min/${dir}/codeExample.html`)) {
      data.code = fs.readFileSync(`./min/${dir}/codeExample.html`, {encoding: 'utf8'})
    }

    for (let i = 0; i < files.length; i++) {
      if (path.extname(files[i]) !== '.html') {
        let filename = files[i].split('-')
        let size = filename.pop().split('.')[0]
        let imgData = {
          url: '',
          fileSize: ''
        }
        data.filename = filename.join('-')
        imgData.url = `/min/${dir}/${files[i]}`
        imgData.fileSize = calculateFileSize(fs.statSync(`./min/${dir}/${files[i]}`).size)

        data.files[size] = imgData

        if (size === 'original') {
          data.original = `/min/${dir}/${files[i]}`
        }
      }
    };
    resolve(data)
  })
}

// give it a directory and it removes all files from it. this is specifically for removing all files from the temp directory without actually removing the temp directory. as with everything else, written as a promise so things can be chained and run in sequence instead of simultaneously
function cleanDirectory (directory) {
  return new Promise((resolve, reject) => {
    rimraf(directory, (err) => {
      if (err) { return handleError(err) }
    })
    return resolve('done')
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

// pretty proud of this one. gets filename, prints out an html snippet with the appropriate markup to use with the async image loading script I wrote concurrently with this project. intentionally left the reject function out of this since it's not necessary. if this fails, user will still get their images.
function printCode (filename, extension, sizes, id) {
  return new Promise((resolve, reject) => {
    let ext = extension
    let fileSource
    let sourceSet = ''
    let fileContents = `<!-- code generated based on file uploaded\r\nremember to update source URL and add an alt tag --> \r\n`
    let o = sizes
    let width = sizeOf(`${__dirname}/../min/${id}/${filename}-original${ext}`).width

    if (o.async) {
      fileSource = `${filename}-async${ext}`
    } else {
      fileSource = `${filename}-original${ext}`
    }

    fileContents += `<img src="/${fileSource}"`

    if (o.xsmall && width >= 320) {
      sourceSet += `/${filename}-xsmall${ext} 320w`
    }

    if (o.small && width >= 480) {
      sourceSet += `,\r\n\t\t `
      sourceSet += `/${filename}-small${ext} 480w`
    }

    if (o.medium && width >= 960) {
      sourceSet += `,\r\n\t\t `
      sourceSet += `/${filename}-medium${ext} 960w`
    }

    if (o.large && width >= 1280) {
      sourceSet += `,\r\n\t\t `
      sourceSet += `/${filename}-large${ext} 1280w`
    }

    if (o.retina && width >= 2560) {
      sourceSet += `,\r\n\t\t `
      sourceSet += `/${filename}-retina${ext} 2160w`
    }

    if (Object.keys(o).length > 1 && width >= 320) {
      fileContents += ` \r\n\t\t data-srcset="${sourceSet}"`
    }

    fileContents += ` />`
    fs.writeFileSync(`${__dirname}/../min/${id}/codeExample.html`, fileContents, (err) => {
      if (err) { return handleError(err) }
    })

    resolve('done')
  }).catch((err) => {
    // we don't throw an error here because it is not necessary to the optimization function
    handleError(err)
  })
}

// writes any errors to the err.log file
function handleError (err) {
  let date = Date(Date.now()).toString()
  let error = ''
  error += '<------------------------------>\r\n'
  error += date + '\r\n'
  error += err + '\r\n'

  fs.stat(`./server/logs/err.log`, (err, stats) => {
    if (err) {
      if (err) { handleError(err); return console.log('Error writing to error log') }
    }

    if (stats.size > 10000) {
      fs.writeFile(`./server/logs/err.log`, error, (err) => {
        if (err) { handleError(err); return console.log('Error writing to error log') }
      })
    } else {
      fs.appendFile('./server/logs/err.log', error, (err) => {
        if (err) { handleError(err); return console.log('Error writing to error log') }
      })
    }
  })
}

// deletes any files and directories older than 3 days that are inside the min directory
function deleteOld (files) {
  if (files.length < 1) {
    return
  }

  for (let i = 0; i < files.length; i++) {
    let mTime = fs.statSync(`./min/${files[i]}`).mtimeMs
    let now = Date.now()

    if ((now - mTime) >= 259200000 && files[i] !== '.DS_Store') {
      rimraf(`./min/${files[i]}`, () => {})
    }
  }
}

module.exports.resizeImages = resizeImages
module.exports.optimizeImages = optimizeImages
module.exports.cleanDirectory = cleanDirectory
module.exports.zipDirectory = zipDirectory
module.exports.printCode = printCode
module.exports.handleError = handleError
module.exports.deleteOld = deleteOld
module.exports.generateAsync = generateAsync
module.exports.collectFiles = collectFiles
module.exports.validateFile = validateFile
