<template>
  <div class="about">
    <h1>{{ $t('common.aboutPage') }}</h1>
  </div>
</template>

<style>
.about {
  padding: 2rem;
  max-width: 880px;
  margin: 0 auto;
  width: 100%;
}

@media (min-width: 1024px) {
  .about {
    padding: 3rem 40px;
  }
}
</style>
