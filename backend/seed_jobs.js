const prisma = require('./src/config/db');

async function insertJobs() {
  const jobs = [
    // 10 NVIDIA Jobs
    {
      title: 'Senior Software Engineer, AI Systems',
      company: 'NVIDIA',
      location: 'Santa Clara, CA, US',
      url: 'https://nvidia.wd5.myworkdayjobs.com/NVIDIAExternalCareerSite/job/US-CA-Santa-Clara/Senior-Software-Engineer--AI-Systems_JR123456',
      atsPlatform: 'workday',
      postedAt: new Date()
    },
    {
      title: 'Deep Learning Compiler Engineer',
      company: 'NVIDIA',
      location: 'Remote, US',
      url: 'https://nvidia.wd5.myworkdayjobs.com/NVIDIAExternalCareerSite/job/US-Remote/Deep-Learning-Compiler-Engineer_JR123457',
      atsPlatform: 'workday',
      postedAt: new Date()
    },
    {
      title: 'Product Manager, GPU Architecture',
      company: 'NVIDIA',
      location: 'Austin, TX, US',
      url: 'https://nvidia.wd5.myworkdayjobs.com/NVIDIAExternalCareerSite/job/US-TX-Austin/Product-Manager--GPU-Architecture_JR123458',
      atsPlatform: 'workday',
      postedAt: new Date()
    },
    {
      title: 'Senior Solutions Architect, Generative AI',
      company: 'NVIDIA',
      location: 'New York, NY, US',
      url: 'https://nvidia.wd5.myworkdayjobs.com/NVIDIAExternalCareerSite/job/US-NY-New-York/Senior-Solutions-Architect--Generative-AI_JR123459',
      atsPlatform: 'workday',
      postedAt: new Date()
    },
    {
      title: 'Systems Software Engineer, Networking',
      company: 'NVIDIA',
      location: 'Pune, India',
      url: 'https://nvidia.wd5.myworkdayjobs.com/NVIDIAExternalCareerSite/job/India-Pune/Systems-Software-Engineer--Networking_JR123460',
      atsPlatform: 'workday',
      postedAt: new Date()
    },
    {
      title: 'Frontend Developer, AI Interfaces',
      company: 'NVIDIA',
      location: 'London, UK',
      url: 'https://nvidia.wd5.myworkdayjobs.com/NVIDIAExternalCareerSite/job/UK-London/Frontend-Developer--AI-Interfaces_JR123461',
      atsPlatform: 'workday',
      postedAt: new Date()
    },
    {
      title: 'Backend Engineer, Cloud Infrastructure',
      company: 'NVIDIA',
      location: 'Santa Clara, CA, US',
      url: 'https://nvidia.wd5.myworkdayjobs.com/NVIDIAExternalCareerSite/job/US-CA-Santa-Clara/Backend-Engineer--Cloud-Infrastructure_JR123462',
      atsPlatform: 'workday',
      postedAt: new Date()
    },
    {
      title: 'Data Scientist, Autonomous Vehicles',
      company: 'NVIDIA',
      location: 'Berlin, Germany',
      url: 'https://nvidia.wd5.myworkdayjobs.com/NVIDIAExternalCareerSite/job/Germany-Berlin/Data-Scientist--Autonomous-Vehicles_JR123463',
      atsPlatform: 'workday',
      postedAt: new Date()
    },
    {
      title: 'Developer Relations Manager',
      company: 'NVIDIA',
      location: 'Remote, US',
      url: 'https://nvidia.wd5.myworkdayjobs.com/NVIDIAExternalCareerSite/job/US-Remote/Developer-Relations-Manager_JR123464',
      atsPlatform: 'workday',
      postedAt: new Date()
    },
    {
      title: 'Hardware Engineer, Silicon Verification',
      company: 'NVIDIA',
      location: 'Bangalore, India',
      url: 'https://nvidia.wd5.myworkdayjobs.com/NVIDIAExternalCareerSite/job/India-Bangalore/Hardware-Engineer--Silicon-Verification_JR123465',
      atsPlatform: 'workday',
      postedAt: new Date()
    },
    
    // 10 ADOBE Jobs
    {
      title: 'Computer Scientist 1 (C++)',
      company: 'Adobe',
      location: 'San Jose, CA, US',
      url: 'https://adobe.wd5.myworkdayjobs.com/external_wehire/job/San-Jose/Computer-Scientist-1--C---_R12345',
      atsPlatform: 'workday',
      postedAt: new Date()
    },
    {
      title: 'Senior UX Designer, Creative Cloud',
      company: 'Adobe',
      location: 'San Francisco, CA, US',
      url: 'https://adobe.wd5.myworkdayjobs.com/external_wehire/job/San-Francisco/Senior-UX-Designer--Creative-Cloud_R12346',
      atsPlatform: 'workday',
      postedAt: new Date()
    },
    {
      title: 'Machine Learning Engineer, Adobe Sensei',
      company: 'Adobe',
      location: 'Seattle, WA, US',
      url: 'https://adobe.wd5.myworkdayjobs.com/external_wehire/job/Seattle/Machine-Learning-Engineer--Adobe-Sensei_R12347',
      atsPlatform: 'workday',
      postedAt: new Date()
    },
    {
      title: 'Product Manager, Acrobat',
      company: 'Adobe',
      location: 'Remote, US',
      url: 'https://adobe.wd5.myworkdayjobs.com/external_wehire/job/Remote/Product-Manager--Acrobat_R12348',
      atsPlatform: 'workday',
      postedAt: new Date()
    },
    {
      title: 'Frontend Engineer, React',
      company: 'Adobe',
      location: 'Noida, India',
      url: 'https://adobe.wd5.myworkdayjobs.com/external_wehire/job/Noida/Frontend-Engineer--React_R12349',
      atsPlatform: 'workday',
      postedAt: new Date()
    },
    {
      title: 'Backend Developer, Node.js',
      company: 'Adobe',
      location: 'London, UK',
      url: 'https://adobe.wd5.myworkdayjobs.com/external_wehire/job/London/Backend-Developer--Nodejs_R12350',
      atsPlatform: 'workday',
      postedAt: new Date()
    },
    {
      title: 'Data Analyst, Digital Media',
      company: 'Adobe',
      location: 'Lehi, UT, US',
      url: 'https://adobe.wd5.myworkdayjobs.com/external_wehire/job/Lehi/Data-Analyst--Digital-Media_R12351',
      atsPlatform: 'workday',
      postedAt: new Date()
    },
    {
      title: 'Cloud Security Engineer',
      company: 'Adobe',
      location: 'San Jose, CA, US',
      url: 'https://adobe.wd5.myworkdayjobs.com/external_wehire/job/San-Jose/Cloud-Security-Engineer_R12352',
      atsPlatform: 'workday',
      postedAt: new Date()
    },
    {
      title: 'DevOps Engineer',
      company: 'Adobe',
      location: 'Remote, US',
      url: 'https://adobe.wd5.myworkdayjobs.com/external_wehire/job/Remote/DevOps-Engineer_R12353',
      atsPlatform: 'workday',
      postedAt: new Date()
    },
    {
      title: 'Quality Assurance Automation Engineer',
      company: 'Adobe',
      location: 'Bangalore, India',
      url: 'https://adobe.wd5.myworkdayjobs.com/external_wehire/job/Bangalore/Quality-Assurance-Automation-Engineer_R12354',
      atsPlatform: 'workday',
      postedAt: new Date()
    }
  ];

  try {
    let count = 0;
    for (let job of jobs) {
      delete job.status;
      await prisma.job.create({
        data: { ...job, description: 'Sample job description for ' + job.title + ' at ' + job.company }
      });
      console.log(`Inserted: ${job.company} - ${job.title}`);
      count++;
    }
    console.log(`Successfully inserted ${count} jobs (10 NVIDIA, 10 Adobe)!`);
  } catch (error) {
    console.error('Error inserting jobs:', error);
  } finally {
    await prisma.$disconnect();
  }
}

insertJobs();
