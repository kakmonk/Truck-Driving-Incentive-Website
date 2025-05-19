<template>
  <div class="homepage">
    
    <section class="hero">
      <div class="hero-overlay"></div>
      <div class="hero-content">
        <h1>DriveGood - Rewarding Safe Driving</h1>
        <p>Encourage safe and responsible driving by rewarding truck drivers for good on-road performance.</p>
        <div class="cta-buttons">
          <router-link to="/login">
            <button class="primary-button">Log In</button>
          </router-link>
          <router-link to="/about">
          <button class="secondary-button">Learn More</button>
        </router-link>

        </div>
      </div>
    </section>

    <section class="features">
      <h2>Why Choose DriveGood?</h2>
      <div class="features-container">
        <div class="feature-box">
          <h3>📊 Track Driver Performance</h3>
          <p>Sponsors can monitor and reward safe driving habits in real-time.</p>
        </div>
        <div class="feature-box">
          <h3>🎁 Earn & Redeem Rewards</h3>
          <p>Drivers earn points for good driving and redeem them for exciting rewards.</p>
        </div>
        <div class="feature-box">
          <h3>🔒 Secure & Reliable</h3>
          <p>Built with modern web technologies to ensure security and scalability.</p>
        </div>
      </div>
    </section>

    
   
  </div>
</template>

<style scoped>

.homepage {
  font-family: Arial, sans-serif;
  color: #f0f0e4;
  text-align: center;
}


.hero {
  position: relative;
  height: 90vh; 
  display: flex;
  align-items: center;
  justify-content: center;
  background: url('../../public/trucks.jpg') no-repeat center center/cover;
}

.hero-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0,0, 0, 0.5); 
}

.hero-content {
  position: relative;
  z-index: 2;
  text-align: center;
  max-width: 600px;
}

.hero-content h1 {
  font-size: 3rem;
}

.hero-content p {
  font-size: 1.5rem;
  margin-top: 10px;
}


.cta-buttons {
  margin-top: 20px;
}

.primary-button,
.secondary-button {
  padding: 12px 20px;
  font-size: 1rem;
  border: none;
  cursor: pointer;
  margin: 10px;
  border-radius: 5px;
}

.primary-button {
  background: #ffcc00;
  color: black;
  font-weight: bold;
}

.secondary-button {
  background: transparent;
  color: white;
  border: 2px solid white;
}


.features {
  padding: 40px 20px;
  background: #f8f8f8;
  color: black;
}

.features h2 {
  font-size: 2rem;
}

.features-container {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-top: 20px;
}

.feature-box {
  background: white;
  padding: 20px;
  border-radius: 10px;
  width: 250px;
  box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1);
}

.feature-box h3 {
  color: #2c3e50;
}


.cta {
  background: #2c3e50;
  color: white;
  padding: 40px;
}

.cta h2 {
  font-size: 2rem;
}

.cta button {
  background: white;
  color: #2c3e50;
  padding: 12px 20px;
  font-size: 1rem;
  border-radius: 5px;
  border: none;
  cursor: pointer;
  margin-top: 20px;
}
</style>
