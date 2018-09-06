<template lang="html">
  <div class="body--wrapper">
    <div id="wait">
      <div class="dank-ass-loader">
        <div class="row">
           <div class="arrow up outer outer-18"></div>
           <div class="arrow down outer outer-17"></div>
           <div class="arrow up outer outer-16"></div>
           <div class="arrow down outer outer-15"></div>
           <div class="arrow up outer outer-14"></div>
        </div>
        <div class="row">
           <div class="arrow up outer outer-1"></div>
           <div class="arrow down outer outer-2"></div>
           <div class="arrow up inner inner-6"></div>
           <div class="arrow down inner inner-5"></div>
           <div class="arrow up inner inner-4"></div>
           <div class="arrow down outer outer-13"></div>
           <div class="arrow up outer outer-12"></div>
        </div>
        <div class="row">
           <div class="arrow down outer outer-3"></div>
           <div class="arrow up outer outer-4"></div>
           <div class="arrow down inner inner-1"></div>
           <div class="arrow up inner inner-2"></div>
           <div class="arrow down inner inner-3"></div>
           <div class="arrow up outer outer-11"></div>
           <div class="arrow down outer outer-10"></div>
        </div>
        <div class="row">
           <div class="arrow down outer outer-5"></div>
           <div class="arrow up outer outer-6"></div>
           <div class="arrow down outer outer-7"></div>
           <div class="arrow up outer outer-8"></div>
           <div class="arrow down outer outer-9"></div>
        </div>
      </div>
    </div>
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

export default {
  data() {
    return {
      exp: "00:00:00",
      loaded: false
    }
  },
  methods: {
    msToTime() {
      let exp = this.created + 259200000
      let now = Date.now()
      let ms = exp - now
        // 1- Convert to seconds:
      var seconds = ms / 1000
        // 2- Extract hours:
      var hours = parseInt(seconds / 3600) // 3,600 seconds in 1 hour
      seconds = seconds % 3600 // seconds remaining after extracting hours
        // 3- Extract minutes:
      var minutes = parseInt(seconds / 60) // 60 seconds in 1 minute
        // 4- Keep only seconds not extracted to minutes:
      seconds = Math.floor(seconds % 60)

      if (minutes < 10) {
        minutes = '0' + minutes
      }

      if (seconds < 10) {
        seconds = '0' + seconds
      }

      this.exp = hours + ':' + minutes + ':' + seconds
    },
    checkExists() {
      let check = setInterval(() => {
        axios.get(`/test/${this.id}`)
          .then((response) => {
            if (response.status === 200) {
              let preload = document.getElementById('original');
              this.files = response.data.files
              this.created = response.data.created
              this.loaded = true;
              preload.setAttribute('src', this.files.files.original.url)
              preload.addEventListener('load', () => {
                this.load();
              })
            }
          })
          .catch((err) => {
            return err
          })
      }, 5000)
    },
    load() {
      this.msToTime()

      let f = this.files
      let filename = document.getElementById('filename')
      let imgWrap = document.getElementById('img--wrapper');
      let images = document.getElementsByClassName('img');
      let intImg = document.getElementsByClassName('int--img');
      let width = imgWrap.dataset.width;
      let original = document.getElementById('original');
      let originalHeight = original.naturalHeight;
      let originalWidth = original.naturalWidth;
      let ratio = width / originalWidth;
      let cellWidth = Math.ceil(width / images.length);
      let originalSize = document.getElementsByClassName('original--size')[0];

      filename.innerText = f.filename

      originalSize.innerText = originalWidth + 'px'
      imgWrap.style.height = originalHeight * ratio + 'px';
      imgWrap.style.width = width + 'px';
      for (let i = 0; i < images.length; i++) {
        images[i].style.width = cellWidth + 'px';
        images[i].style.height = originalHeight * ratio + 'px';
        images[i].style.left = cellWidth * i + 'px';
        intImg[i].style.left = '-' + cellWidth * i + 'px';
        intImg[i].style.width = width + 'px';
      }
      setInterval(() => {
        this.msToTime()
      }, 1000)
      wait.style.display = 'none'
    }
  },
  computed: {
    formatCode() {
        return this.code.split('\r\n').join('<br />').toString()
    }
  },
  mounted() {
    let wait = document.getElementById('wait');

    axios.get(`/test/${this.id}`)
      .then((response) => {
        if (response.status !== 200) {
          this.checkExists();
        } else {
          let preload = document.getElementById('original');
          this.files = response.data.files
          this.created = response.data.created
          this.loaded = true;
          preload.setAttribute('src', this.files.files.original.url)
          preload.addEventListener('load', () => {
            this.load();
          })
        }
      })
      .catch(function(err) {
        return;
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
