<script setup>
  import { ref, onMounted } from 'vue';
  import { getRequest, table } from '../external/api-requests.ts'
  const sentence = ref('');

  onMounted(async () => {
    try {
      let data = await getRequest(table.users, 1);
      sentence.value = data["Sentence"]["S"]; 
    } catch (error) {
      console.error("Error fetching sentence:", error);
    }
  });
</script>

<template>
  <div class="about-page">

    <section class="hero">
      <div class="hero-overlay"></div>
      <div class="hero-content">
        <h1>About DriveGood</h1>
        <p>DriveGood is a web-based platform designed to encourage safe driving habits by rewarding truck drivers.</p>
      </div>
    </section>

    <!-- About Content Section -->
    <section class="about-content">
      <h2>🔍 About the System</h2>
      <p>DriveGood is designed as a <strong>web-based platform</strong> to ensure accessibility and collaboration.</p>
      <b v-if="sentence">📢 {{ sentence }}</b> <!-- Injected sentence -->
      <div class="content-grid">
        <div class="card">
          <h3>🏆 Incentivizing Safe Driving</h3>
          <p>Sponsors can reward truck drivers based on performance.</p>
        </div>
        <div class="card">
          <h3>📊 Real-time Tracking</h3>
          <p>Performance metrics help sponsors manage rewards effectively.</p>
        </div>
        <div class="card">
          <h3>💡 Built for Scalability</h3>
          <p>DriveGood leverages modern technologies for a secure and seamless experience.</p>
        </div>
      </div>
    </section>


    <section class="tech-choices">
      <h2> Team Technology Choices</h2>
      <ul>
        <li>🖥️ <strong>Frontend:</strong> Vue.js for a modern and reactive interface.</li>
        <li>💾 <strong>Database:</strong> DynamoDB for structured and efficient data management.</li>
        <li>🌐 <strong>Application Type:</strong> Web-based for easy collaboration.</li>
        <li>⚙️ <strong>DevOps:</strong> Focus on automation and deployment workflows.</li>
      </ul>
    </section>

  
  </div>
  </template>
  
  <style scoped>

  .about-page {
    font-family: Arial, sans-serif;
    color: black;
    text-align: center;
  }
  
  
  .hero {
    position: relative;
    height: 70vh; 
    display: flex;
    align-items: center;
    justify-content: center;
    background: url('../../public/trucks.jpg') no-repeat center center/cover;
    color: white;
  }
  

  .hero-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.65); 
  }
  
  /* Hero Content */
  .hero-content {
    position: relative;
    z-index: 2;
    text-align: center;
    max-width: 600px;
  }
  
  .hero-content h1 {
    font-size: 2.8rem;
    margin-bottom: 10px;
  }
  
  .hero-content p {
    font-size: 1.3rem;
    opacity: 0.9;
  }
  
  /* About Content Section */
  .about-content {
    padding: 50px 20px;
    background:whitesmoke;
  }
  
  .about-content h2 {
    font-size: 2rem;
    color: #2c3e50;
  }
  

  .content-grid {
    display: flex;
    justify-content: center;
    gap: 20px;
    margin-top: 20px;
    flex-wrap: wrap;
  }
  
  .card {
    background: rgb(226, 230, 225);
    padding: 20px;
    border-radius: 20px;
    width: 280px;
    box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.5);
    text-align: center;
  }
  
  .card h3 {
    color: #34495e;
  }
  
  /* Technology Section */
  .tech-choices {
    padding: 40px 20px;
    background: whitesmoke;
  }
  
  .tech-choices h2 {
    font-size: 2rem;
    color: black;
  }
  
  ul {
    list-style-type: none;
    padding: 0;
  }
  
  ul li {
    margin: 10px 0;
    font-size: 1.1rem;
  }
  
  /* Contact Section */
  .contact-section {
    background: #58794f;
    color: white;
    padding: 40px;
  }
  
  .contact-section h2 {
    font-size: 2rem;
  }
  
  .contact-button {
    background: white;
    color: black;
    padding: 12px 20px;
    font-size: 1rem;
    border-radius: 5px;
    border: none;
    cursor: pointer;
    margin-top: 20px;
  }
  
  .contact-button:hover {
    background: #11df33;
  }
  </style>
