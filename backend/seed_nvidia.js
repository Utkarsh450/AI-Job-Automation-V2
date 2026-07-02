const prisma = require('./src/config/db');

async function insertJobs() {
  const jobs = [
    {
      title: 'Senior Software Engineer, AI Systems',
      company: 'NVIDIA',
      location: 'Santa Clara, CA, US',
      url: 'https://nvidia.wd5.myworkdayjobs.com/NVIDIAExternalCareerSite/job/US-CA-Santa-Clara/Senior-Software-Engineer--AI-Systems_JR123456',
      atsPlatform: 'workday',
      status: 'NEW',
      postedAt: new Date()
    },
    {
      title: 'Deep Learning Compiler Engineer',
      company: 'NVIDIA',
      location: 'Remote, US',
      url: 'https://nvidia.wd5.myworkdayjobs.com/NVIDIAExternalCareerSite/job/US-Remote/Deep-Learning-Compiler-Engineer_JR123457',
      atsPlatform: 'workday',
      status: 'NEW',
      postedAt: new Date()
    },
    {
      title: 'Product Manager, GPU Architecture',
      company: 'NVIDIA',
      location: 'Austin, TX, US',
      url: 'https://nvidia.wd5.myworkdayjobs.com/NVIDIAExternalCareerSite/job/US-TX-Austin/Product-Manager--GPU-Architecture_JR123458',
      atsPlatform: 'workday',
      status: 'NEW',
      postedAt: new Date()
    },
    {
      title: 'Senior Solutions Architect, Generative AI',
      company: 'NVIDIA',
      location: 'New York, NY, US',
      url: 'https://nvidia.wd5.myworkdayjobs.com/NVIDIAExternalCareerSite/job/US-NY-New-York/Senior-Solutions-Architect--Generative-AI_JR123459',
      atsPlatform: 'workday',
      status: 'NEW',
      postedAt: new Date()
    },
    {
      title: 'Systems Software Engineer, Networking',
      company: 'NVIDIA',
      location: 'Pune, India',
      url: 'https://nvidia.wd5.myworkdayjobs.com/NVIDIAExternalCareerSite/job/India-Pune/Systems-Software-Engineer--Networking_JR123460',
      atsPlatform: 'workday',
      status: 'NEW',
      postedAt: new Date()
    },
    {
      title: 'Frontend Developer, AI Interfaces',
      company: 'NVIDIA',
      location: 'London, UK',
      url: 'https://nvidia.wd5.myworkdayjobs.com/NVIDIAExternalCareerSite/job/UK-London/Frontend-Developer--AI-Interfaces_JR123461',
      atsPlatform: 'workday',
      status: 'NEW',
      postedAt: new Date()
    },
    {
      title: 'Backend Engineer, Cloud Infrastructure',
      company: 'NVIDIA',
      location: 'Santa Clara, CA, US',
      url: 'https://nvidia.wd5.myworkdayjobs.com/NVIDIAExternalCareerSite/job/US-CA-Santa-Clara/Backend-Engineer--Cloud-Infrastructure_JR123462',
      atsPlatform: 'workday',
      status: 'NEW',
      postedAt: new Date()
    },
    {
      title: 'Data Scientist, Autonomous Vehicles',
      company: 'NVIDIA',
      location: 'Berlin, Germany',
      url: 'https://nvidia.wd5.myworkdayjobs.com/NVIDIAExternalCareerSite/job/Germany-Berlin/Data-Scientist--Autonomous-Vehicles_JR123463',
      atsPlatform: 'workday',
      status: 'NEW',
      postedAt: new Date()
    },
    {
      title: 'Developer Relations Manager',
      company: 'NVIDIA',
      location: 'Remote, US',
      url: 'https://nvidia.wd5.myworkdayjobs.com/NVIDIAExternalCareerSite/job/US-Remote/Developer-Relations-Manager_JR123464',
      atsPlatform: 'workday',
      status: 'NEW',
      postedAt: new Date()
    },
    {
      title: 'Hardware Engineer, Silicon Verification',
      company: 'NVIDIA',
      location: 'Bangalore, India',
      url: 'https://nvidia.wd5.myworkdayjobs.com/NVIDIAExternalCareerSite/job/India-Bangalore/Hardware-Engineer--Silicon-Verification_JR123465',
      atsPlatform: 'workday',
      status: 'NEW',
      postedAt: new Date()
    }
  ];

  try {
    for (let job of jobs) {
      delete job.status;
      await prisma.job.create({
        data: { ...job, description: 'Sample job description for ' + job.title }
      });
      console.log(`Inserted: ${job.title}`);
    }
    console.log('Successfully inserted 10 NVIDIA jobs!');
  } catch (error) {
    console.error('Error inserting jobs:', error);
  } finally {
    await prisma.$disconnect();
  }
}

insertJobs();
