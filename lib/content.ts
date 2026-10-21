// Long-form content in English and Arabic: FAQ, About, Terms and Privacy.
// Arabic text should be reviewed by a native speaker before launch.
import type { Lang } from "./i18n";

export const FAQ: Record<Lang, [string, string][]> = {
  en: [
    ["How is the price calculated?", "Gold weight × today's gold rate for the karat you choose, plus the making charge per gram shown on each design, plus any stones. The website shows an estimate; your quote confirms the exact price."],
    ["How long does it take?", "Most pieces take 2 to 4 weeks after you approve the design and pay the advance. Bridal sets can take longer. Your quote shows the date."],
    ["Do I need to pay in advance?", "Yes. An advance confirms your order and covers the gold. The rest is paid when you collect or receive your piece."],
    ["Can I see the design before you make it?", "Yes. We send you a drawing or render to approve on your tracking page. We only start once you approve it."],
    ["Is the gold hallmarked?", "Yes. Every piece is stamped with its karat: 22K (916), 21K (875) or 18K (750)."],
    ["Can you make a name in Arabic?", "Yes, in Arabic or English, in the style you choose. You can preview it on the website."],
    ["Can I bring my own idea or old gold?", "Yes. Upload a photo or sketch with your request. If you'd like to use your old gold, tell us in the notes and bring it to the showroom."],
    ["Can I return a custom piece?", "Custom pieces are made only for you, so they can't be returned or exchanged unless there's a fault. Please read our Terms."],
  ],
  ar: [
    ["كيف يُحسب السعر؟", "وزن الذهب × سعر الذهب اليوم للعيار الذي تختاره، مضافًا إليه أجرة الصياغة لكل غرام الموضحة في كل تصميم، وثمن الأحجار إن وجدت. يعرض الموقع سعرًا تقديريًا، ويؤكد عرض السعر المبلغ النهائي."],
    ["كم يستغرق التنفيذ؟", "تستغرق معظم القطع من أسبوعين إلى أربعة أسابيع بعد الموافقة على التصميم ودفع الدفعة المقدمة. قد تستغرق أطقم العرائس وقتًا أطول. يوضح عرض السعر الموعد."],
    ["هل يجب الدفع مقدمًا؟", "نعم. تؤكد الدفعة المقدمة طلبك وتغطي قيمة الذهب، ويُدفع الباقي عند الاستلام."],
    ["هل أرى التصميم قبل التنفيذ؟", "نعم. نرسل لك رسمًا أو صورة للتصميم لتوافق عليه في صفحة تتبّع الطلب، ولا نبدأ إلا بعد موافقتك."],
    ["هل الذهب مدموغ؟", "نعم. تُدمغ كل قطعة بعيارها: ٢٢ (٩١٦) أو ٢١ (٨٧٥) أو ١٨ (٧٥٠)."],
    ["هل يمكن صنع اسم بالعربية؟", "نعم، بالعربية أو الإنجليزية وبالخط الذي تختاره، ويمكنك معاينته على الموقع."],
    ["هل يمكنني إحضار فكرتي أو ذهبي القديم؟", "نعم. أرفق صورة أو رسمًا مع طلبك. وإذا رغبت باستخدام ذهبك القديم، اذكر ذلك في الملاحظات وأحضره إلى المعرض."],
    ["هل يمكن إرجاع القطعة المصنوعة حسب الطلب؟", "تُصنع القطع حسب الطلب خصيصًا لك، لذا لا يمكن إرجاعها أو استبدالها إلا في حال وجود عيب. يرجى قراءة الشروط والأحكام."],
  ],
};

export const ABOUT: Record<Lang, { title: string; paras: string[] }> = {
  en: {
    title: "About Kohinoor Kraft Jewellery",
    paras: [
      "Kohinoor Kraft Jewellery makes custom gold jewellery in Doha: name necklaces, rings, bangles, pendants and bridal sets, designed with each customer and handcrafted by our goldsmiths.",
      "We are part of Kohinoor Jewellery, at the Gold Center in the Old Gold Souq. Every piece is made in hallmarked 22K, 21K or 18K gold, priced on the day's gold rate with the making charge shown clearly.",
      "You approve the design before we start, and you can follow your order online from request to collection.",
    ],
  },
  ar: {
    title: "عن كوهينور كرافت للمجوهرات",
    paras: [
      "تصنع كوهينور كرافت للمجوهرات الذهب حسب الطلب في الدوحة: قلائد بالأسماء، خواتم، بناجر، دلايات وأطقم عرائس، نصممها مع كل عميل ويصوغها صاغتنا يدويًا.",
      "نحن جزء من كوهينور للمجوهرات في جولد سنتر بسوق الذهب القديم. تُصنع كل قطعة من ذهب مدموغ عيار ٢٢ أو ٢١ أو ١٨، بسعر الذهب اليومي مع أجرة صياغة واضحة.",
      "توافق على التصميم قبل أن نبدأ، ويمكنك متابعة طلبك عبر الإنترنت من لحظة الطلب حتى الاستلام.",
    ],
  },
};

type Section = { h: string; p?: string; li?: string[] };

export function terms(lang: Lang, c: { legalName: string; cr: string; advance: number }): Section[] {
  if (lang === "ar") return [
    { h: "١. من نحن", p: `يدير هذا الموقع ${c.legalName}، شركة ذات مسؤولية محدودة مسجلة في دولة قطر بسجل تجاري رقم ${c.cr}، وتعمل باسم "كوهينور كرافت للمجوهرات". باستخدامك الموقع أو تقديم طلب، فإنك توافق على هذه الشروط.` },
    { h: "٢. القطع حسب الطلب", li: ["تُصنع كل قطعة خصيصًا لك وفق الخيارات والتصميم الذي توافق عليه.", "الصور والمعاينات على الموقع توضيحية. قد تختلف القطعة المصنوعة يدويًا اختلافًا طفيفًا في الشكل والحجم.", "الذهب مدموغ بعياره: ٢٢ (٩١٦) أو ٢١ (٨٧٥) أو ١٨ (٧٥٠)."] },
    { h: "٣. الأسعار وعرض السعر", li: ["السعر = الوزن × سعر الذهب للعيار المختار + أجرة الصياغة لكل غرام + ثمن الأحجار. جميع الأسعار بالريال القطري.", "السعر المعروض على الموقع تقديري. نرسل لك عرض سعر يتضمن الإجمالي والدفعة المقدمة وموعد التسليم.", "يُحتسب السعر النهائي حسب الوزن الفعلي للقطعة المنجزة، وقد يختلف الوزن عن عرض السعر بنسبة تصل إلى ٥٪.", "يُثبَّت سعر الذهب في عرض السعر عند استلام الدفعة المقدمة."] },
    { h: "٤. الدفعة المقدمة والدفع", li: [`يُؤكَّد الطلب عند دفع دفعة مقدمة، عادةً ${c.advance}٪ من عرض السعر.`, "يُدفع المبلغ المتبقي نقدًا أو بالبطاقة عند الاستلام أو التوصيل.", "لا نجمع بيانات البطاقات على هذا الموقع."] },
    { h: "٥. الموافقة على التصميم والتعديلات", li: ["نرسل لك رسمًا أو صورة للتصميم للموافقة عليه، ولا تبدأ الصياغة إلا بعد موافقتك.", "يمكن طلب تعديلات قبل الموافقة. أما التعديلات بعد بدء الصياغة فقد تتطلب تكلفة ووقتًا إضافيين."] },
    { h: "٦. الإلغاء والاسترجاع", li: ["يمكنك إلغاء الطلب قبل الموافقة على التصميم مع استرداد الدفعة المقدمة كاملة.", "بعد الموافقة على التصميم وبدء الصياغة، لا يمكن استرداد الدفعة المقدمة لأن الذهب يُخصص لقطعتك.", "لا يمكن إرجاع القطع المصنوعة حسب الطلب أو استبدالها إلا في حال وجود عيب في الصنع.", "لا يؤثر أي مما سبق على حقوقك بموجب قانون حماية المستهلك القطري رقم (٨) لسنة ٢٠٠٨."] },
    { h: "٧. الاستلام والتوصيل", p: "نبلغك عندما تكون قطعتك جاهزة. يمكنك استلامها من المعرض أو طلب توصيلها داخل قطر. قد نطلب إبراز البطاقة الشخصية أو جواز السفر عند الاستلام." },
    { h: "٨. الضمان والعناية", p: "نصلح مجانًا أي عيب في الصنع يظهر خلال ٦ أشهر من الاستلام. ولا يشمل ذلك الضرر الناتج عن الاستخدام أو الحوادث. يمكنك إحضار قطعتك للتنظيف والتلميع في أي وقت." },
    { h: "٩. الملكية الفكرية", p: "التصاميم والصور والشعار ومحتوى الموقع ملك لنا. يحق لنا عرض صور القطع التي نصنعها في معرض أعمالنا ما لم تطلب خلاف ذلك." },
    { h: "١٠. القانون المطبق", p: "تخضع هذه الشروط لقوانين دولة قطر، بما فيها قانون المعاملات والتجارة الإلكترونية (المرسوم بقانون رقم ١٦ لسنة ٢٠١٠)، وتختص محاكم قطر بأي نزاع. في حال وجود اختلاف بين النسختين العربية والإنجليزية، تُعتمد النسخة العربية." },
  ];
  return [
    { h: "1. Who we are", p: `This website is run by ${c.legalName}, a limited liability company (W.L.L.) registered in the State of Qatar under Commercial Registration No. ${c.cr}, trading as "Kohinoor Kraft Jewellery". By using the website or placing a request, you agree to these terms.` },
    { h: "2. Custom-made pieces", li: ["Every piece is made specially for you, to the options and design you approve.", "Photos and previews on the website are illustrations. Handmade pieces may differ slightly in shape and size.", "Gold is hallmarked with its karat: 22K (916), 21K (875) or 18K (750)."] },
    { h: "3. Prices and quotes", li: ["Price = weight × the gold rate for the chosen karat + the making charge per gram + any stones. All prices are in Qatari Riyals (QAR).", "Prices shown on the website are estimates. We send you a quote with the total, the advance and a ready-by date.", "The final price is based on the actual weight of the finished piece, which may differ from the quote by up to 5%.", "The gold rate in your quote is fixed once we receive your advance."] },
    { h: "4. Advance and payment", li: [`Your order is confirmed when you pay an advance, normally ${c.advance}% of the quote.`, "The balance is paid in cash or by card when you collect or receive your piece.", "We do not collect card details on this website."] },
    { h: "5. Design approval and changes", li: ["We send you a drawing or render to approve. We only start making your piece after you approve it.", "You can ask for changes before you approve. Changes after making has started may cost extra and take longer."] },
    { h: "6. Cancellations and returns", li: ["You can cancel before you approve the design and receive your advance back in full.", "Once you have approved the design and making has started, the advance can't be refunded, because the gold is set aside for your piece.", "Custom pieces can't be returned or exchanged unless there is a manufacturing fault.", "None of this affects your rights under Qatar's Consumer Protection Law (Law No. 8 of 2008)."] },
    { h: "7. Collection and delivery", p: "We let you know when your piece is ready. You can collect it from our showroom or ask for delivery within Qatar. We may ask to see your QID or passport at collection." },
    { h: "8. Warranty and care", p: "We repair any manufacturing fault free of charge within 6 months of collection. This doesn't cover damage from wear or accidents. You can bring your piece for cleaning and polishing at any time." },
    { h: "9. Designs and content", p: "Our designs, photos, logo and website content belong to us. We may show photos of pieces we make in our portfolio unless you ask us not to." },
    { h: "10. Governing law", p: "These terms are governed by the laws of the State of Qatar, including the Electronic Commerce and Transactions Law (Decree-Law No. 16 of 2010), and the courts of Qatar have jurisdiction. If the Arabic and English versions differ, the Arabic version prevails." },
  ];
}

export function privacy(lang: Lang, c: { legalName: string; cr: string }): Section[] {
  if (lang === "ar") return [
    { h: "١. من المسؤول عن بياناتك", p: `${c.legalName} (سجل تجاري رقم ${c.cr})، وتعمل باسم "كوهينور كرافت للمجوهرات". نتعامل مع البيانات الشخصية وفقًا للقانون القطري رقم (١٣) لسنة ٢٠١٦ بشأن حماية خصوصية البيانات الشخصية.` },
    { h: "٢. ما نجمعه", li: ["بيانات الطلب: الاسم ورقم الجوال والبريد الإلكتروني (اختياري) وخيارات التصميم والنص المراد حفره والملاحظات.", "الصور المرجعية أو الرسومات التي ترفقها، وتُحفظ في مساحة تخزين خاصة لا يصل إليها إلا فريقنا.", "رسائلك إلينا عبر واتساب أو الهاتف أو البريد الإلكتروني."] },
    { h: "٣. لماذا نستخدمها", li: ["لإعداد عرض السعر وتصميم قطعتك وصنعها وتسليمها.", "للتواصل معك بشأن طلبك وإتاحة تتبّعه.", "للاحتفاظ بالسجلات التي يتطلبها القانون القطري."] },
    { h: "٤. مع من نشاركها", li: ["لا نبيع بياناتك أبدًا.", "مع فريقنا وصاغتنا لتنفيذ طلبك.", "مع مزودي الاستضافة وقاعدة البيانات الذين يشغّلون الموقع، وقد تكون خوادمهم خارج قطر.", "مع واتساب (ميتا) عندما تختار التواصل معنا عبره.", "مع الجهات الحكومية في قطر عندما يتطلب القانون ذلك."] },
    { h: "٥. مدة الاحتفاظ", p: "نحتفظ بسجلات الطلبات للمدة التي تتطلبها القوانين التجارية والمحاسبية في قطر، ونحذف الصور المرجعية عندما لا نعود بحاجة إليها." },
    { h: "٦. حقوقك", p: "يمكنك أن تطلب الاطلاع على بياناتك أو تصحيحها أو حذفها، أو التوقف عن مراسلتك تسويقيًا، عبر التواصل معنا. سنرد خلال ٣٠ يومًا." },
    { h: "٧. على جهازك", p: "لا نستخدم ملفات تعريف الارتباط الإعلانية أو أدوات التتبّع." },
  ];
  return [
    { h: "1. Who is responsible for your data", p: `${c.legalName} (C.R. No. ${c.cr}), trading as "Kohinoor Kraft Jewellery". We handle personal data in line with Qatar's Law No. 13 of 2016 on the Protection of Personal Data Privacy.` },
    { h: "2. What we collect", li: ["Request details: your name, mobile number, email (optional), design choices, the text to engrave and your notes.", "Reference photos or sketches you upload. They are stored privately and only our team can see them.", "Messages you send us on WhatsApp, by phone or by email."] },
    { h: "3. Why we use it", li: ["To prepare your quote, and to design, make and hand over your piece.", "To contact you about your order and let you track it.", "To keep the records Qatari law requires."] },
    { h: "4. Who we share it with", li: ["We never sell your data.", "Our team and goldsmiths, to make your order.", "The hosting and database providers that run this website. Their servers may be outside Qatar.", "WhatsApp (Meta), when you choose to contact us there.", "Government authorities in Qatar, when the law requires it."] },
    { h: "5. How long we keep it", p: "We keep order records for as long as Qatari commercial and accounting laws require, and delete reference photos when we no longer need them." },
    { h: "6. Your rights", p: "You can ask to see, correct or delete your data, or to stop marketing messages, by contacting us. We reply within 30 days." },
    { h: "7. On your device", p: "We do not use advertising cookies or tracking tools." },
  ];
}
