<!-- eslint-disable vue/multi-word-component-names -->
<script setup lang="ts">
import DataImportExport from './DataImportExport.vue'
</script>

<template>
  <footer class="footer">
    <div class="footer-content">
      <DataImportExport />
    </div>
  </footer>
</template>

<style scoped>
.footer {
  margin-top: auto;
  padding: 0.75rem 0;
  background: white;
  border-top: 1px solid #eee;
  width: 100%;
}

.footer-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
  display: flex;
  justify-content: flex-start;
  align-items: center;
}

@media (min-width: 768px) {
  .footer-content {
    padding-left: 32px;
    padding-right: 32px;
  }
}

@media (min-width: 1024px) {
  .footer-content {
    padding-left: 40px;
    padding-right: 40px;
  }
}
</style> 