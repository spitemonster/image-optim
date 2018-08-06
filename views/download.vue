<template lang="html">
  <div>
    <h1>Download</h1>
    <p><a :href="zipUrl">Download Zip</a></p>
    <div class="image--grid">
      <div v-for="image in files">
        <a :href="image"><img :src="image"></a>
      </div>
    </div>
  </div>
</template>

<script>
const fs = require('fs')

export default {
  data() {
    return {

    }
  },
  methods: {

  },
  mounted() {
    fs.readdirSync()
  }
}
</script>

<style lang="css">
</style>
