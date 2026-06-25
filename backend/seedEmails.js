require('dotenv').config();
const prisma = require('./src/config/db');

async function seed() {
  const user = await prisma.user.findFirst();
  if (!user) {
    console.log("No user found to seed emails for.");
    return;
  }

  const userId = user.id;

  await prisma.email.deleteMany({
    where: { userId }
  });

  const mockEmails = [
    {
      userId,
      fromName: 'Stripe Careers',
      fromEmail: 'careers@stripe.com',
      subject: 'Update regarding your application for Frontend Engineer',
      bodyHtml: '<h3>Hi there,</h3><p>Thank you for taking the time to apply to Stripe.</p><p>We have reviewed your application and would like to invite you to an initial screening call with our recruiting team. Please let us know your availability for next week.</p><p>Best,<br/>Stripe Recruiting</p>',
      bodyText: 'Hi there, Thank you for taking the time to apply to Stripe. We have reviewed your application and would like to invite you to an initial screening call with our recruiting team. Please let us know your availability for next week. Best, Stripe Recruiting',
      isRead: false
    },
    {
      userId,
      fromName: 'Linear',
      fromEmail: 'noreply@linear.app',
      subject: 'Your application has been received',
      bodyHtml: '<h3>Application Received</h3><p>We have received your application for the Full Stack Developer role. Our team will review your profile and get back to you shortly.</p>',
      bodyText: 'Application Received. We have received your application for the Full Stack Developer role. Our team will review your profile and get back to you shortly.',
      isRead: true
    },
    {
      userId,
      fromName: 'Netflix Talent',
      fromEmail: 'talent@netflix.com',
      subject: 'Next Steps: Senior UI Engineer',
      bodyHtml: '<h3>Congratulations!</h3><p>We were very impressed by your background and would love to move you forward to the technical assessment phase. You will receive a separate email with instructions on how to access the assessment.</p>',
      bodyText: 'Congratulations! We were very impressed by your background and would love to move you forward to the technical assessment phase. You will receive a separate email with instructions on how to access the assessment.',
      isRead: false
    }
  ];

  await prisma.email.createMany({
    data: mockEmails
  });

  console.log(`Seeded 3 mock emails for user ${user.email}`);
}

seed()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
