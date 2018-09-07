<template lang="html">
  <div class="body--wrapper">
    <wait id="wait"></wait>
    <img id="original">
    <div class="output--wrapper" v-if="loaded">
      <h1 id="filename"></h1>
      <div id="img--wrapper" data-width="800" style="height: 500px;">
        <div class="img" v-if="files.files.async">
          <a :href="files.files.async.url"><img class="int--img" :src="files.files.async.url" /></a>
          <h3>Async / 960px / {{ files.files.async.fileSize }}</h3>
        </div>
        <div class="img" v-if="files.files.xsmall">
          <a :href="files.files.xsmall.url"><img class="int--img" :src="files.files.xsmall.url" /></a>
          <h3>X-Small / 320px / {{ files.files.xsmall.fileSize }}</h3>
        </div>
        <div class="img" v-if="files.files.small">
          <a :href="files.files.small.url"><img class="int--img" :src="files.files.small.url" /></a>
          <h3>Small / 480px / {{ files.files.small.fileSize }}</h3>
        </div>
        <div class="img" v-if="files.files.medium">
          <a :href="files.files.medium.url"><img class="int--img" :src="files.files.medium.url" /></a>
          <h3>Medium / 960px / {{ files.files.medium.fileSize }}</h3>
        </div>
        <div class="img" v-if="files.files.large">
          <a :href="files.files.large.url"><img class="int--img" :src="files.files.large.url" /></a>
          <h3>Large / 1280px / {{ files.files.large.fileSize }}</h3>
        </div>
        <div class="img" v-if="files.files.retina">
          <a :href="files.files.retina.url"><img class="int--img" :src="files.files.retina.url" /></a>
          <h3>Retina / 2560px / {{ files.files.retina.fileSize }}</h3>
        </div>
        <div class="img" v-if="files.files.original" style="height: 100%;">
          <a :href="files.files.original.url"><img class="int--img" style="width: 100%" :src="files.files.original.url" /></a>
          <h3>Original / <span class="original--size"></span> / {{ files.files.original.fileSize }}</h3>
        </div>
      </div>
      <pre v-if="files.code" class="code--example"><code>
      {{ files.code }}
      </code></pre>
      <div class="exp">
        <p>This file will expire in {{ exp }}</p>
      </div>
      <div class="async--info">
        <p>Example code is intended for use with the asynchronous image loading script available <a href="https://github.com/spitemonster/utilities">here</a></p>
      </div>
          <div class="links">
              <a :href="zipUrl" class="link--button">Download Zip</a>
              <a href="https://github.com/spitemonster/image-optim" class="link--button">Report Bug / Request Feature</a>
              <a href="/" class="link--button">Return</a>
          </div>
    </div>
  </div>
</template>

<script>
import wait from './wait.vue'
export default {
  data () {
    return {
      exp: '00:00:00',
      loaded: false
    }
  },
  components: {
    wait
  },
  methods: {
    msToTime () {
      let exp = this.created + 259200000
      let now = Date.now()
      let ms = exp - now
      var seconds = ms / 1000
      var hours = parseInt(seconds / 3600)
      seconds = seconds % 3600
      var minutes = parseInt(seconds / 60)
      seconds = Math.floor(seconds % 60)

      if (minutes < 10) {
        minutes = '0' + minutes
      }

      if (seconds < 10) {
        seconds = '0' + seconds
      }

      this.exp = hours + ':' + minutes + ':' + seconds
    },
    checkExists () {
      let check = setInterval(() => {
        /* eslint-disable */
        axios.get(`/test/${this.id}`)
        /* eslint-enable */
          .then((response) => {
            if (response.status === 200) {
              clearInterval(check)
              let preload = document.querySelector('#original')
              this.files = response.data.files
              this.created = response.data.created
              this.loaded = true
              preload.setAttribute('src', this.files.files.original.url)
              preload.addEventListener('load', () => {
                this.load()
              })
            }
          })
          .catch((err) => {
            return err
          })
      }, 5000)
    },
    load () {
      this.msToTime()

      let f = this.files
      let loader = document.querySelector('#wait')
      let filename = document.querySelector('#filename')
      let imgWrap = document.querySelector('#img--wrapper')
      let images = document.querySelectorAll('.img')
      let intImg = document.querySelectorAll('.int--img')
      let width = imgWrap.dataset.width
      let original = document.querySelector('#original')
      let originalHeight = original.naturalHeight
      let originalWidth = original.naturalWidth
      let ratio = width / originalWidth
      let cellWidth = Math.ceil(width / images.length)
      let originalSize = document.querySelector('.original--size')

      filename.innerText = f.filename

      originalSize.innerText = originalWidth + 'px'
      imgWrap.style.height = originalHeight * ratio + 'px'
      imgWrap.style.width = width + 'px'
      for (let i = 0; i < images.length; i++) {
        images[i].style.width = cellWidth + 'px'
        images[i].style.height = originalHeight * ratio + 'px'
        images[i].style.left = cellWidth * i + 'px'
        intImg[i].style.left = '-' + cellWidth * i + 'px'
        intImg[i].style.width = width + 'px'
      }
      setInterval(() => {
        this.msToTime()
      }, 1000)
      loader.style.display = 'none'
    }
  },
  computed: {
    formatCode () {
      return this.code.split('\r\n').join('<br />').toString()
    }
  },
  mounted () {
    /* eslint-disable */
    axios.get(`/test/${this.id}`)
    /* eslint-enable */
      .then((response) => {
        if (response.status !== 200) {
          this.checkExists()
        } else {
          let preload = document.querySelector('#original')
          this.files = response.data.files
          this.created = response.data.created
          this.loaded = true
          preload.setAttribute('src', this.files.files.original.url)
          preload.addEventListener('load', () => {
            this.load()
          })
        }
      })
  }
}
</script>

<style lang="css">
#original {
  display: none;
}

#wait {
  display: flex;
}
</style>
