<template lang="html">
  <div class="body--wrapper">
    <img id="original" :src="original">
    <div class="output--wrapper">
      <h1>{{ filename }}</h1>
      <div id="img--wrapper" data-width="800" style="height: 500px;">
        <div class="img" v-if="files.async">
          <a :href="files.async.url"><img class="int--img" :src="files.async.url" /></a>
          <h3>Async / 960px / {{ files.async.fileSize }}</h3>
        </div>
        <div class="img" v-if="files.xsmall">
          <a :href="files.xsmall.url"><img class="int--img" :src="files.xsmall.url" /></a>
          <h3>X-Small / 320px / {{ files.xsmall.fileSize }}</h3>
        </div>
        <div class="img" v-if="files.small">
          <a :href="files.small.url"><img class="int--img" :src="files.small.url" /></a>
          <h3>Small / 480px / {{ files.small.fileSize }}</h3>
        </div>
        <div class="img" v-if="files.medium">
          <a :href="files.medium.url"><img class="int--img" :src="files.medium.url" /></a>
          <h3>Medium / 960px / {{ files.medium.fileSize }}</h3>
        </div>
        <div class="img" v-if="files.large">
          <a :href="files.large.url"><img class="int--img" :src="files.large.url" /></a>
          <h3>Large / 1280px / {{ files.large.fileSize }}</h3>
        </div>
        <div class="img" v-if="files.retina">
          <a :href="files.retina.url"><img class="int--img" :src="files.retina.url" /></a>
          <h3>Retina / 2560px / {{ files.retina.fileSize }}</h3>
        </div>
        <div class="img" v-if="files.original" style="height: 100%;">
          <a :href="files.original.url"><img class="int--img" style="width: 100%" :src="files.original.url" /></a>
          <h3>Original / <span class="original--size"></span> / {{ files.original.fileSize }}</h3>
        </div>
      </div>
  <pre v-if="code" class="code--example"><code>
  {{ code }}
  </code></pre>
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
    }
  },
  methods: {},
  computed: {
    formatCode() {
        return this.code.split('\r\n').join('<br />').toString()
    }
  },
  mounted() {
    console.log(this.files)
    let images = document.getElementsByClassName('img');
    let intImg = document.getElementsByClassName('int--img');
    let imgWrapper = document.getElementById('img--wrapper');
    let width = imgWrapper.dataset.width;
    let cellWidth = Math.ceil(width / images.length);
    let original = document.getElementById('original')
    let originalHeight;
    let originalWidth;
    let ratio;
    let originalSize = document.getElementsByClassName('original--size')[0];

    original.addEventListener('load', () => {
      ratio = width / original.naturalWidth;
      originalHeight = original.naturalHeight ? original.naturalHeight : 500;
      originalWidth = original.naturalWidth;
      originalSize.innerText = originalWidth + 'px'

      imgWrapper.style.height = originalHeight * ratio + 'px';
      imgWrapper.style.width = width + 'px';

      for (let i = 0; i < images.length; i++) {
        images[i].style.width = cellWidth + 'px';
        images[i].style.height = originalHeight * ratio + 'px';
        images[i].style.left = cellWidth * i + 'px';
        intImg[i].style.left = '-' + cellWidth * i + 'px';
        intImg[i].style.width = width + 'px';
      }
    })
  }
}

</script>

<style lang="css">
#original {
  display: none;
}
</style>
