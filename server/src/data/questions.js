// Question bank: 6 roles × 3 languages × 5 questions
const questions = {
  software_engineer: {
    en: [
      "Describe a situation where you had to design a highly scalable system. What database did you choose and why?",
      "Explain the event loop in Node.js or concurrency in your primary language. How do you prevent blocking the main thread?",
      "How would you diagnose and fix a sudden memory leak in a production application?",
      "Explain the CAP theorem. Give an example of a system that prioritizes Availability over Consistency.",
      "Walk me through how you would implement a distributed rate limiter for a public API."
    ],
    hi: [
      "एक ऐसी situation बताइए जहाँ आपको highly scalable system design करना पड़ा। आपने कौन सा database चुना और क्यों?",
      "Node.js में event loop या अपनी primary language में concurrency को समझाइए। Main thread को block होने से कैसे रोकते हैं?",
      "Production application में अचानक होने वाले memory leak को आप कैसे diagnose और fix करेंगे?",
      "CAP theorem समझाइए। एक ऐसे system का उदाहरण दीजिए जो Consistency से ज्यादा Availability को priority देता है।",
      "Public API के लिए distributed rate limiter आप कैसे implement करेंगे?"
    ],
    kn: [
      "ನೀವು highly scalable system ಅನ್ನು ವಿನ್ಯಾಸಗೊಳಿಸಬೇಕಾದ ಸನ್ನಿವೇಶವನ್ನು ವಿವರಿಸಿ. ಯಾವ database ಆಯ್ಕೆ ಮಾಡಿದಿರಿ ಮತ್ತು ಏಕೆ?",
      "Node.js ನಲ್ಲಿ event loop ಅಥವಾ ನಿಮ್ಮ primary language ನಲ್ಲಿ concurrency ವಿವರಿಸಿ. Main thread block ಆಗುವುದನ್ನು ಹೇಗೆ ತಡೆಯುತ್ತೀರಿ?",
      "Production application ನಲ್ಲಿ ದಿಢೀರ್ ಆಗುವ memory leak ಅನ್ನು ಹೇಗೆ diagnose ಮತ್ತು fix ಮಾಡುತ್ತೀರಿ?",
      "CAP theorem ವಿವರಿಸಿ. Consistency ಗಿಂತ Availability ಗೆ ಆದ್ಯತೆ ನೀಡುವ system ನ ಉದಾಹರಣೆ ಕೊಡಿ.",
      "Public API ಗಾಗಿ distributed rate limiter ಅನ್ನು ಹೇಗೆ implement ಮಾಡುತ್ತೀರಿ ವಿವರಿಸಿ."
    ]
  },
  data_analyst: {
    en: [
      "Walk me through your experience with data analysis tools.",
      "How would you handle missing or inconsistent data in a dataset?",
      "Describe a data insight that drove a business decision.",
      "What's the difference between correlation and causation? Give an example.",
      "How do you present complex data findings to a non-technical audience?"
    ],
    hi: [
      "Data analysis tools के साथ अपने experience के बारे में बताइए।",
      "Dataset में missing या inconsistent data को आप कैसे handle करेंगे?",
      "एक data insight बताइए जिसने business decision को प्रभावित किया।",
      "Correlation और causation में क्या अंतर है? उदाहरण दीजिए।",
      "Non-technical audience को complex data findings कैसे present करते हैं?"
    ],
    kn: [
      "Data analysis tools ಜೊತೆ ನಿಮ್ಮ ಅನುಭವದ ಬಗ್ಗೆ ಹೇಳಿ.",
      "Dataset ನಲ್ಲಿ missing ಅಥವಾ inconsistent data ಅನ್ನು ಹೇಗೆ handle ಮಾಡುತ್ತೀರಿ?",
      "Business decision ಅನ್ನು ಪ್ರಭಾವಿಸಿದ data insight ಅನ್ನು ವಿವರಿಸಿ.",
      "Correlation ಮತ್ತು causation ನಡುವಿನ ವ್ಯತ್ಯಾಸ ಏನು? ಉದಾಹರಣೆ ಕೊಡಿ.",
      "Non-technical ಪ್ರೇಕ್ಷಕರಿಗೆ complex data findings ಅನ್ನು ಹೇಗೆ present ಮಾಡುತ್ತೀರಿ?"
    ]
  },
  marketing_executive: {
    en: [
      "Tell me about a successful marketing campaign you ran.",
      "How do you measure the ROI of a digital marketing campaign?",
      "How would you market our product to Tier-2 and Tier-3 Indian cities?",
      "Describe your experience with social media marketing.",
      "How do you stay updated with the latest marketing trends?"
    ],
    hi: [
      "एक successful marketing campaign के बारे में बताइए जो आपने run किया।",
      "Digital marketing campaign का ROI कैसे measure करते हैं?",
      "Tier-2 और Tier-3 भारतीय शहरों में हमारे product को कैसे market करेंगे?",
      "Social media marketing के साथ अपने experience के बारे में बताइए।",
      "Latest marketing trends के साथ updated कैसे रहते हैं?"
    ],
    kn: [
      "ನೀವು run ಮಾಡಿದ successful marketing campaign ಬಗ್ಗೆ ಹೇಳಿ.",
      "Digital marketing campaign ನ ROI ಅನ್ನು ಹೇಗೆ measure ಮಾಡುತ್ತೀರಿ?",
      "Tier-2 ಮತ್ತು Tier-3 Indian ನಗರಗಳಿಗೆ ನಮ್ಮ product ಅನ್ನು ಹೇಗೆ market ಮಾಡುತ್ತೀರಿ?",
      "Social media marketing ಜೊತೆ ನಿಮ್ಮ ಅನುಭವ ವಿವರಿಸಿ.",
      "Latest marketing trends ಜೊತೆ updated ಆಗಿ ಹೇಗೆ ಇರುತ್ತೀರಿ?"
    ]
  },
  hr_executive: {
    en: [
      "How do you source and attract top talent for hard-to-fill roles?",
      "Describe how you handled a conflict between two employees.",
      "How do you approach employee engagement and retention?",
      "What metrics do you use to evaluate HR effectiveness?",
      "How do you ensure diversity and inclusion in hiring?"
    ],
    hi: [
      "Hard-to-fill roles के लिए top talent को कैसे source और attract करते हैं?",
      "दो employees के बीच conflict को आपने कैसे handle किया?",
      "Employee engagement और retention के लिए आपका approach क्या है?",
      "HR effectiveness evaluate करने के लिए कौन से metrics use करते हैं?",
      "Hiring में diversity और inclusion कैसे सुनिश्चित करते हैं?"
    ],
    kn: [
      "Hard-to-fill roles ಗಾಗಿ top talent ಅನ್ನು ಹೇಗೆ source ಮತ್ತು attract ಮಾಡುತ್ತೀರಿ?",
      "ಇಬ್ಬರು employees ನಡುವಿನ conflict ಅನ್ನು ಹೇಗೆ handle ಮಾಡಿದಿರಿ?",
      "Employee engagement ಮತ್ತು retention ಗಾಗಿ ನಿಮ್ಮ approach ಏನು?",
      "HR effectiveness ಅನ್ನು evaluate ಮಾಡಲು ಯಾವ metrics ಬಳಸುತ್ತೀರಿ?",
      "Hiring ನಲ್ಲಿ diversity ಮತ್ತು inclusion ಅನ್ನು ಹೇಗೆ ಖಚಿತಪಡಿಸುತ್ತೀರಿ?"
    ]
  },
  sales_executive: {
    en: [
      "Tell me about your highest-value deal and how you closed it.",
      "How do you handle rejection from a potential client?",
      "Describe your sales process from lead to close.",
      "How do you build long-term relationships with clients?",
      "How would you sell our product to a skeptical customer?"
    ],
    hi: [
      "अपनी सबसे बड़ी deal के बारे में बताइए और आपने उसे कैसे close किया।",
      "Potential client की rejection को आप कैसे handle करते हैं?",
      "Lead से close तक अपना sales process describe करिए।",
      "Clients के साथ long-term relationships कैसे बनाते हैं?",
      "Skeptical customer को हमारा product कैसे sell करेंगे?"
    ],
    kn: [
      "ನಿಮ್ಮ ಅತ್ಯಂತ ದೊಡ್ಡ deal ಬಗ್ಗೆ ಮತ್ತು ಅದನ್ನು ಹೇಗೆ close ಮಾಡಿದಿರಿ ಹೇಳಿ.",
      "Potential client ನ rejection ಅನ್ನು ಹೇಗೆ handle ಮಾಡುತ್ತೀರಿ?",
      "Lead ನಿಂದ close ವರೆಗಿನ ನಿಮ್ಮ sales process ವಿವರಿಸಿ.",
      "Clients ಜೊತೆ long-term relationships ಅನ್ನು ಹೇಗೆ build ಮಾಡುತ್ತೀರಿ?",
      "Skeptical customer ಗೆ ನಮ್ಮ product ಅನ್ನು ಹೇಗೆ sell ಮಾಡುತ್ತೀರಿ?"
    ]
  },
  customer_support: {
    en: [
      "How do you handle an angry customer who demands a refund?",
      "Describe a time you went above and beyond for a customer.",
      "How do you manage multiple customer issues simultaneously?",
      "What tools or software have you used for customer support?",
      "How do you maintain a positive attitude during a difficult shift?"
    ],
    hi: [
      "Refund मांगने वाले angry customer को आप कैसे handle करते हैं?",
      "एक ऐसा समय बताइए जब आपने customer के लिए extra mile जाया।",
      "Multiple customer issues को simultaneously कैसे manage करते हैं?",
      "Customer support के लिए कौन से tools या software use किए हैं?",
      "मुश्किल shift के दौरान positive attitude कैसे maintain करते हैं?"
    ],
    kn: [
      "Refund ಕೇಳುತ್ತಿರುವ angry customer ಅನ್ನು ಹೇಗೆ handle ಮಾಡುತ್ತೀರಿ?",
      "Customer ಗಾಗಿ ನೀವು extra mile ಹೋದ ಸಮಯ ಬಗ್ಗೆ ಹೇಳಿ.",
      "Multiple customer issues ಅನ್ನು simultaneously ಹೇಗೆ manage ಮಾಡುತ್ತೀರಿ?",
      "Customer support ಗಾಗಿ ಯಾವ tools ಅಥವಾ software ಬಳಸಿದ್ದೀರಿ?",
      "Difficult shift ಸಮಯದಲ್ಲಿ positive attitude ಅನ್ನು ಹೇಗೆ maintain ಮಾಡುತ್ತೀರಿ?"
    ]
  }
};

module.exports = questions;
