<template>
  <div class="landing-page">
    <div class="content">
      <div class="logo">
        <img src="@/assets/cocktail.svg" alt="Cocktail icon">
      </div>
      <h1>調酒成本計算機</h1>
      <p class="subtitle">這是一個可以計算調酒成本的數位計算工具！</p>
      <RouterLink to="/recipes" class="cta-button">
        開始計算調酒成本
      </RouterLink>
    </div>
  </div>
</template>

<style scoped>
.landing-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  background-color: #1a1a1a;
  color: white;
}

.content {
  padding: 2rem;
  max-width: 600px;
}

.logo {
  margin-bottom: 2rem;
}

.logo img {
  width: 120px;
  height: 120px;
}

h1 {
  font-size: 2.5rem;
  margin-bottom: 1rem;
  font-weight: bold;
}

.subtitle {
  font-size: 1.2rem;
  color: #cccccc;
  margin-bottom: 3rem;
}

.cta-button {
  display: inline-block;
  background-color: #4CAF50;
  color: white;
  text-decoration: none;
  padding: 1rem 2rem;
  border-radius: 8px;
  font-size: 1.2rem;
  font-weight: bold;
  transition: background-color 0.3s ease;
}

.cta-button:hover {
  background-color: #45a049;
}
</style> 