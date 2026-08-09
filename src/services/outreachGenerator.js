/**
 * AI Outreach Generator & Approval Synthesizer
 * Generates personalized multi-channel outreach based on company signals & pain points.
 */

export function generatePersonalizedOutreach(company, scoreData) {
  const cName = company.companyName || "your company";
  const dmName = company.decisionMaker?.name || "Team Lead";
  const dmTitle = company.decisionMaker?.title || "Decision Maker";
  const firstName = dmName.split(" ")[0];
  const location = company.location || "your region";
  const industry = company.industry || "industry";
  const trigger = company.triggers || company.expansionSignals?.[0] || "expanding business operations";
  const mainProblem = company.potentialProblems?.[0] || "manual operational bottlenecks";

  // Cold Email Template
  const emailSubject = `Operational visibility & AI workflow automation for ${cName}`;
  const emailBody = `Hi ${firstName},

We noticed that ${cName} is currently ${trigger.toLowerCase()} in ${location}. As you scale your ${industry.toLowerCase()} operations, managing ${mainProblem.toLowerCase()} often becomes a major bottleneck for leadership teams.

At Synvora, we help growing ${industry.toLowerCase()} businesses automate repetitive manual workflows, eliminate quotation/dispatch delays, and gain real-time operational visibility using custom AI agents and digital tools.

For instance, we recently helped a leading ${industry.toLowerCase()} firm reduce RFP response times by 80% and automate multi-location workflow handoffs—without changing their core systems.

Given your role as ${dmTitle}, would you be open to a brief 10-minute discovery chat next Tuesday to see how Synvora could streamline operations for ${cName}?

Best regards,

Synvora Lead Intelligence Team
Synvora Technologies
www.synvora.com | contact@synvora.com`;

  // LinkedIn InMail / Connection Note
  const linkedinMessage = `Hi ${firstName}, saw that ${cName} is ${trigger.toLowerCase()}. We help ${industry.toLowerCase()} leaders automate manual workflows & multi-site operational handoffs with AI. Would love to connect and share a quick case study relevant to ${location}!`;

  // WhatsApp Business Message
  const whatsappMessage = `Hello ${firstName} sir/ma'am, greetings from Synvora Technologies! 🚀

We noticed ${cName}'s recent growth in ${location}. We specialize in helping ${industry.toLowerCase()} companies automate manual operational processes and build AI-powered workflow bots (reducing response times by up to 80%).

May I share a 1-page PDF showing how we helped a similar ${industry.toLowerCase()} business?

Regards,
Synvora Intelligence Team`;

  // Cold Call Opening Script
  const callScript = `“Hi ${firstName}, this is [My Name] from Synvora Technologies. I'm reaching out specifically to you as ${dmTitle} at ${cName}. We've been following your expansion in ${location}, and I know scaling ${industry.toLowerCase()} operations often brings headaches around ${mainProblem.toLowerCase()}. We build custom AI tools that solve that exact bottleneck in under 3 weeks. Do you have 2 minutes to hear how?”`;

  return {
    email: {
      subject: emailSubject,
      body: emailBody
    },
    linkedin: linkedinMessage,
    whatsapp: whatsappMessage,
    callScript: callScript,
    reasoning: `Outreach customized based on ${cName}'s trigger ("${trigger}") and detected pain point ("${mainProblem}").`
  };
}
