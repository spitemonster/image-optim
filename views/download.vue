<template lang="html">
  <div class="body--wrapper">
    <div class="output--wrapper">
      <div class="image--grid">
        <div v-for="image in files">
            <a :href="image"><img :src="image"></a>
        </div>
      </div>
  <pre class="code--example"><code>
  {{ code }}
  </code></pre>
      <div class="links">
          <a :href="zipUrl">Download Zip</a>
          <a href="/">Return</a>
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
    console.log(this.formatCode);
  }
}

</script>
