<template lang="html">
  <div class="body--wrapper">
    <h1 class="logo">IMGIT</h1>
    <div class="form--wrapper">
      <form action="/upload" name="upload" method="post" enctype="multipart/form-data" id="fileUpload">
        <div class="filename">
          <label for="output-name">Output File Name</label>
          <input type="text" name="outPutName" value="" id="output-name"/>
        </div>

        <div class="image--select">
          <h1>Select Image</h1>
          <input type="file" name="inputImage" id="image" class="inputfile" />
          <div class="file--finder">
            <label for="image" class="button">Browse...</label>
            <p id="fileName">No file selected.</p>
          </div>
        </div>

        <div class="input--error" v-if="fileError">
          <p>Please select a valid JP(E)G, PNG, SVG or GIF.</p>
        </div>

        <div class="input--error" v-if="inputError">
          <p>Optimization and resizing options are available only for JPEG and PNG files</p>
          <p v-if="svgError">Be aware that SVG optimization can take a long time. Be patient, please.</p>
        </div>

        <div class="advanced" v-if="fileSelected">
          <h1>Advanced</h1>
          <h1 class="plus" @click="advanced = !advanced">
            <span v-if="!advanced">+</span>
            <span v-if="advanced">-</span>
          </h1>
        </div>
        <fieldset v-bind:class="{open: advanced, optimizationOptions: true}">

          <label class="section--label">Optimization Options</label>
          <p>The original image will be optimized and included with all selections</p>

          <div class="size--options">
            <div class="option">
              <input type="hidden" name="xsmall" value="0">
              <input type="checkbox" name="sizes" id="xtra-small" class="sizeToggle" value="xsmall"/>
              <label for="xtra-small" class="size--option"></label>
              <p>320px</p>
            </div>

            <div class="option">
              <input type="checkbox" name="sizes" id="small" class="sizeToggle" value="small"/>
              <label for="small" class="size--option"></label>
              <p>480px</p>
            </div>

            <div class="option">
              <input type="checkbox" name="sizes" id="med" class="sizeToggle" value="medium"/>
              <label for="med" class="size--option"></label>
              <p>960px</p>
            </div>

            <div class="option">
              <input type="checkbox" name="sizes" id="large" class="sizeToggle" value="large"/>
              <label for="large" class="size--option"></label>
              <p>1280px</p>
            </div>

            <div class="option">
              <input type="checkbox" name="sizes" id="retina" class="sizeToggle" value="retina"/>
              <label for="retina" class="size--option"></label>
              <p>2560px</p>
            </div>

            <div class="option">
              <input type="checkbox" name="toggleAll" value="" id="toggleAll"/>
              <label for="toggleAll" id="toggleAllLabel"></label>
              <p>All Sizes</p>
            </div>
          </div>

          <label class="section--label">Async Options</label>
          <p>If Async is selected, an image 960px wide with reduced quality will be created, with optional blurring and pixellation</p>
          <div class="async--options">
            <div class="option">
              <input type="checkbox" name="async" id="async" v-model="asyncSelected"/>
              <label for="async" id="async--label"></label>
              <p>Async</p>
            </div>

            <div class="option async--option">
              <input type="radio" name="asyncShape" value="none" id="async-none" class="asyncOption"/>
              <label for="async-none"></label>
              <p>None</p>
            </div>

            <div class="option async--option">
              <input type="radio" name="asyncShape" value="blur" id="async-blur" class="asyncOption"/>
              <label for="async-blur"></label>
              <p>Blur</p>
            </div>

            <div class="option async--option">
              <input type="radio" id="pixel" name="asyncShape" value="pixel" class="asyncOption"/>
              <label for="pixel"></label>
              <p>Pixellate</p>
            </div>

            <div class="option async--option">
              <input type="radio" id="tri" name="asyncShape" value="tri" class="asyncOption"/>
              <label for="tri"></label>
              <p>Tessellate</p>
            </div>
          </div>
        </fieldset>
        <fieldset class="submit">
          <button type="submit" name="button" @click="wait()" id="submit" disabled>Upload</button>
        </fieldset>
      </form>
    </div>

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
  </div>
</template>

<script>
export default {
  data() {
    return {
      content: 'Turtles are awful',
      asyncSelected: false,
      advanced: false,
      inputError: false,
      svgError: false,
      fileSelected: false,
      fileError: false
    }
  },
  mounted() {
    let toggleAll = document.getElementById('toggleAll');
    let toggleAllLabel = document.getElementById('toggleAllLabel');
    let sizeOptions = document.getElementsByClassName('size--option');
    let asyncToggle = document.getElementById('async');
    let asyncToggles = document.getElementsByClassName('async--option');
    let asyncOptions = document.getElementsByClassName('asyncOption');
    let sizeToggles = document.getElementsByClassName('sizeToggle');
    let fileInput = document.getElementById('image');
    let asyncLabel = document.getElementById('async--label');
    let image = document.getElementById('image');
    let plus = document.getElementsByClassName('plus')[0];
    let advanced = document.getElementsByClassName('advanced')[0];
    let submit = document.getElementById('submit');
    let outputName = document.getElementById('output-name')

    toggleAll.addEventListener('change', () => {
      if (sizeToggles[0].checked) {
        for (let i = 0; i < sizeToggles.length; i++) {
          setTimeout(() => {
            sizeToggles[i].checked = !sizeToggles[i].checked;
          }, 100 * i)
        }
      } else {
        for (let i = sizeToggles.length - 1, j = 0; i >= 0; i--, j++) {
          setTimeout(() => {
            sizeToggles[i].checked = !sizeToggles[i].checked;
          }, 100 * j)
        }
      }
    });

    toggleAllLabel.addEventListener('mouseenter', () => {
      for (let i = sizeOptions.length - 1, j = 0; i >= 0; i--, j++) {
        setTimeout(() => {
          sizeOptions[i].classList.add('hover');
        }, 50 * j)
      }
    })

    toggleAllLabel.addEventListener('mouseleave', () => {
      for (let i = 0; i < sizeOptions.length; i++) {
        setTimeout(() => {
          sizeOptions[i].classList.remove('hover');
        }, 50 * i)
      }
    })

    fileInput.addEventListener('change', () => {
      let fileArray = fileInput.value.split('\\');
      let file = fileArray[fileArray.length - 1];
      let fileName = document.getElementById('fileName')

      fileName.innerText = file;
    })

    asyncToggle.addEventListener('change', () => {
      if (asyncToggles[0].classList.contains('show')) {
        for (let i = asyncToggles.length - 1, j = 0; i >= 0; i--, j++) {
          setTimeout(() => {
            asyncToggles[i].classList.remove('show')
          }, 100 * j)
        }
      } else {
        for (let i = 0; i < asyncToggles.length; i ++) {
          setTimeout(() => {
            asyncToggles[i].classList.add('show')
          }, 100 * i)
        }
      }
    })

    asyncLabel.addEventListener('mouseenter', () => {
      for (let i = 0; i < asyncToggles.length; i ++) {
        setTimeout(() => {
          asyncToggles[i].classList.add('half')
        }, 100 * i)
      }
    })

    asyncLabel.addEventListener('mouseleave', () => {
      for (let i = asyncToggles.length - 1, j = 0; i >= 0; i--, j++) {
        setTimeout(() => {
          asyncToggles[i].classList.remove('half')
        }, 100 * j)
      }
    })

    image.addEventListener('change', () => {
      let ext = image.value.split('.')[image.value.split('.').length - 1];

      if (ext != 'jpg' && ext != 'jpeg' && ext != 'png' && ext != 'svg' && ext != 'gif') {
        image.value = '';
        this.fileError = true;
        this.fileSelected = false;
      }

      if (ext != 'jpg' && ext != 'jpeg' && ext != 'png' && ext == 'svg' || ext == 'gif') {
        this.inputError = true;
        this.fileSelected = false;
        this.advanced = false;
        toggleAll.checked = false;

        for (let i = 0; i < sizeToggles.length; i++) {
          sizeToggles[i].checked = false;
        }

        for (let i = 0; i < asyncOptions.length; i++) {
          asyncOptions[i].checked = false;
          // asyncToggles[i].classList.remove('show')
        }

        console.log(asyncToggle.checked)
        submit.removeAttribute('disabled');
      }

      if (this.inputError && ext == 'svg') {
        this.svgError = true;
      }

      if (ext == 'jpg' || ext == 'jpeg' || ext == 'png') {
        this.fileSelected = true;
        this.inputError = false;
        this.svgError = false;
        submit.removeAttribute('disabled');
      }
    })
  },
  methods: {
    changeContent() {
      this.content = 'Turtles are great!'
    },
    wait() {
      let form = document.getElementsByClassName('form--wrapper')[0]
      let logo = document.getElementsByClassName('logo')[0]
      let wait = document.getElementById('wait');
      form.style.display = 'none';
      wait.style.display = 'flex';
      logo.style.display = 'none';
    }
  }
}
</script>

<style lang="css">
</style>
