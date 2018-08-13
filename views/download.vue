<template lang="html">
  <div class="body--wrapper">
    <img id="original" :src="original">
    <div class="output--wrapper">
      <h1>{{ filename }}</h1>
      <div id="img--wrapper" data-width="800" style="height: 500px;">
        <div class="img" v-if="files.async">
          <a :href="files.async"><img class="int--img" :src="files.async" /></a>
          <h3>Async / 960px</h3>
        </div>
        <div class="img" v-if="files.xsmall">
          <a :href="files.async"><img class="int--img" :src="files.xsmall" /></a>
          <h3>X-Small / 320px</h3>
        </div>
        <div class="img" v-if="files.small">
          <a :href="files.async"><img class="int--img" :src="files.small" /></a>
          <h3>Small / 480px</h3>
        </div>
        <div class="img" v-if="files.medium">
          <a :href="files.async"><img class="int--img" :src="files.medium" /></a>
          <h3>Medium / 960px</h3>
        </div>
        <div class="img" v-if="files.large">
          <a :href="files.async"><img class="int--img" :src="files.large" /></a>
          <h3>Large / 1280px</h3>
        </div>
        <div class="img" v-if="files.retina">
          <a :href="files.async"><img class="int--img" :src="files.retina" /></a>
          <h3>Retina / 2560px</h3>
        </div>
        <div class="img" v-if="files.original" style="height: 100%;">
          <a :href="files.original"><img class="int--img" style="width: 100%" :src="files.original" /></a>
          <h3>Original / <span class="original--size"></span></h3>
        </div>
      </div>
  <pre v-if="code" class="code--example"><code>
  {{ code }}
  </code></pre>
      <div class="links">
          <a :href="zipUrl" class="link--button">Download Zip</a>
          <a href="/" class="link--button">Return</a>
      </div>
    </div>
  </div>
</template>

<script>

export default {
  data() {
    return {
      files: ['turtle', 'horse']
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
