<template lang="html">
  <div>
    <form action="/upload" name="upload" method="post" enctype="multipart/form-data" id="fileUpload">
      <fieldset>
        <label for="output-name">Output File Name</label>
        <input type="text" name="outPutName" value="" id="output-name"/>
      </fieldset>

      <fieldset>
        <label for="image">Select Image</label>
        <input name="inputImage" type="file" id="image"/>
      </fieldset>

      <fieldset>
        <legend>Select Optimization Options</legend>
        <p>The original image will be optimized and included with all selections</p>

        <label for="toggleAll">Toggle All Sizes</label>
        <input type="checkbox" name="toggleAll" value="" id="toggleAll"/>
        <label for="xtra-small">320px</label>
        <input type="checkbox" name="xsmall" id="xtra-small" class="sizeToggle" />
        <label for="small">480px</label>
        <input type="checkbox" name="small" id="small" class="sizeToggle" />
        <label for="med">960px</label>
        <input type="checkbox" name="medium" id="med" class="sizeToggle" />
        <label for="large">1280px</label>
        <input type="checkbox" name="large" id="large" class="sizeToggle" />
        <label for="retina">2560px</label>
        <input type="checkbox" name="retina" id="retina" class="sizeToggle" />
        <label for="async">Async</label>
        <p>If Async is selected, an image 960px wide with reduced quality will be created, with optional blurring and pixellation </p>
        <input type="checkbox" name="async" v-model="asyncSelected"/>
        <label for="async-options" v-if="asyncSelected">Async Options</label>
        <label for="async-blur" v-if="asyncSelected">Blur</label>
        <input type="checkbox" name="asyncBlur" v-if="asyncSelected" id="async-blur" />
        <fieldset id="asyncShape" v-if="asyncSelected">
          <label for="asyncShape">Pixelate or Tessellate?</label>
          <input type="radio" id="pixel" name="asyncShape" value="pixel" v-if="asyncSelected" />
          <label for="pixel">Pixellate</label>
          <input type="radio" id="tri" name="asyncShape" value="tri" v-if="asyncSelected" />
          <label for="tri">Tessellate</label>
        </fieldset>
      </fieldset>
      <button type="submit" name="button" @click="wait()">Upload</button>
    </form>
    <div id="wait">
      <div class='loader loader1'>
        <div>
          <div>
            <div>
              <div>
                <div>
                  <div></div>
                </div>
              </div>
            </div>
          </div>
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
      asyncSelected: false
    }
  },
  mounted() {
    let toggleAll = document.getElementById('toggleAll');
    let sizeToggles = document.getElementsByClassName('sizeToggle');

    toggleAll.addEventListener('change', () => {
      for (let i = 0; i < sizeToggles.length; i++) {
        sizeToggles[i].checked = !sizeToggles[i].checked;
      }
    });
  },
  methods: {
    changeContent() {
      this.content = 'Turtles are great!'
    },
    wait() {
      let form = document.getElementsByTagName('form')[0]
      let wait = document.getElementById('wait');
      form.style.display = 'none';
      wait.style.visibility = 'visible';
    }
  }
}
</script>

<style lang="css">
form {}
fieldset {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start;
  align-content: flex-start;
  border: none;
}

fieldset input {
  margin-bottom: 1em;
}

fieldset label {
  display: inline;
}

fieldset input[type="checkbox"] {
  float: left;
}

#wait {
  visibility: hidden;
}

@keyframes rotate {
	0% {
		transform: rotate(0deg);
	}
	50% {
		transform: rotate(180deg);
	}
	100% {
		transform: rotate(360deg);
	}
}

.loader {
	position: relative;
	margin: 75px auto;
	width: 150px;
	height: 150px;
	display: block;
	overflow: hidden;
}

.loader div {
  height: 100%;
}

/* loader 1 */
.loader1, .loader1 div {
  border-radius: 50%;
	padding: 8px;
	border: 2px solid transparent;
	animation: rotate linear 3.5s infinite;
	border-top-color: rgba(0, 0, 0, .5);
	border-bottom-color: rgba(0, 0, 255, .5);
}
</style>
