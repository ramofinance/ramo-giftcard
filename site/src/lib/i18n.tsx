import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Language = "fa" | "ar" | "en" | "es" | "zh";
type Translation = [string, string, string, string, string];

export const LANGUAGES: { code: Language; label: string }[] = [
  { code: "fa", label: "فارسی" },
  { code: "ar", label: "العربية" },
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "zh", label: "中文" }
];

const MESSAGES: Record<string, Translation> = {
  "language.label": ["زبان", "اللغة", "Language", "Idioma", "语言"],
  "app.title": ["RAMO Gift Card | کارت هدیه رمزارز", "RAMO Gift Card | بطاقة عملات رقمية", "RAMO Gift Card | Crypto gift cards", "RAMO Gift Card | Tarjetas cripto", "RAMO Gift Card | 加密货币礼品卡"],
  "nav.templates": ["قالب‌ها", "القوالب", "Templates", "Diseños", "贺卡模板"],
  "nav.gifts": ["هدیه‌های من", "هداياي", "My gifts", "Mis regalos", "我的礼物"],
  "banner.pending": ["یک هدیه‌ی نیمه‌کاره دارید؛ برای ادامه یا بازیابی اینجا بزنید", "لديك هدية غير مكتملة؛ اضغط للمتابعة أو الاستعادة", "You have an unfinished gift. Continue or recover it here.", "Tienes un regalo sin terminar. Continúa o recupéralo aquí.", "您有一份未完成的礼物，点击此处继续或恢复。"],
  "footer": ["RAMO Finance • شبکه‌ی BNB Smart Chain • ۱۲ کلمه‌ی کیف هدیه روی سرور ما ذخیره نمی‌شود", "RAMO Finance • شبكة BNB Smart Chain • لا نحفظ كلمات محفظة الهدية على خوادمنا", "RAMO Finance • BNB Smart Chain • Gift wallet recovery words are never stored on our server", "RAMO Finance • BNB Smart Chain • Nunca guardamos las palabras de recuperación en nuestro servidor", "RAMO Finance • BNB Smart Chain • 礼物钱包助记词不会保存在我们的服务器上"],
  "home.eyebrow": ["RAMO FINANCE · هدیه‌های دیجیتال", "RAMO FINANCE · هدايا رقمية", "RAMO FINANCE · DIGITAL GIFTS", "RAMO FINANCE · REGALOS DIGITALES", "RAMO FINANCE · 数字礼物"],
  "home.title": ["هدیه‌ی رمزارزی بدهید،\nبه‌سادگی یک کارت تبریک", "أرسل هديةً رقمية،\nبسهولة بطاقة تهنئة", "Send a crypto gift,\nas easily as a greeting card", "Regala criptomonedas,\ntan fácil como una tarjeta", "送出加密货币礼物，\n就像发送贺卡一样简单"],
  "home.description": ["یک کارت زیبا با مبلغ دلخواه تتر. گیرنده در تلگرام کارت و کیف پول تازه‌اش را می‌گیرد؛ بدون نیاز به دانش قبلی.", "بطاقة جميلة بقيمة USDT التي تختارها. يستلمها المتلقي على تيليجرام مع محفظة جديدة، دون الحاجة إلى خبرة مسبقة.", "A beautiful card with the USDT amount you choose. The recipient gets it on Telegram with a new wallet, no prior crypto knowledge needed.", "Una tarjeta bonita con la cantidad de USDT que elijas. La persona la recibe en Telegram con una cartera nueva, sin experiencia previa.", "用您选择的 USDT 金额制作精美贺卡。收礼人会在 Telegram 收到贺卡和新钱包，无需任何加密货币经验。"],
  "home.choose": ["انتخاب قالب", "اختر قالبًا", "Choose a design", "Elegir diseño", "选择模板"],
  "home.start": ["شروع سریع", "ابدأ الآن", "Start now", "Empezar", "立即开始"],
  "home.count": ["۳۲ طرح آماده‌ی هدیه", "٣٢ تصميمًا جاهزًا للهدايا", "32 ready-to-send designs", "32 diseños listos para regalar", "32 款礼物设计"],
  "home.steps.1.title": ["قالب را انتخاب کنید", "اختر التصميم", "Choose a design", "Elige un diseño", "选择模板"],
  "home.steps.1.body": ["از بین طرح‌های کارت، مناسب لحظه‌تان را بردارید.", "اختر بطاقة تناسب مناسبتك.", "Pick a card for the occasion.", "Elige una tarjeta para la ocasión.", "挑选一张适合此刻的贺卡。"],
  "home.steps.2.title": ["مبلغ و پیام را بنویسید", "أضف المبلغ والرسالة", "Add an amount and message", "Añade el importe y un mensaje", "填写金额和祝福"],
  "home.steps.2.body": ["USDT یا USDC روی شبکه‌ی BNB Chain، با اسم و پیام دلخواه.", "USDT أو USDC على BNB Chain، مع الاسم والرسالة التي تختارها.", "USDT or USDC on BNB Chain, with your names and message.", "USDT o USDC en BNB Chain, con los nombres y mensaje que quieras.", "在 BNB Chain 上使用 USDT 或 USDC，并填写姓名与祝福。"],
  "home.steps.3.title": ["با کیف پول خودتان پرداخت کنید", "ادفع من محفظتك", "Pay from your wallet", "Paga desde tu cartera", "使用自己的钱包付款"],
  "home.steps.3.body": ["پرداخت مستقیم از کیف شما انجام می‌شود؛ ما به کلیدتان دسترسی نداریم.", "يتم الدفع مباشرة من محفظتك؛ ولا نصل إلى مفاتيحك.", "Payment comes directly from your wallet. We never access your keys.", "El pago sale directamente de tu cartera. Nunca accedemos a tus claves.", "款项直接从您的钱包支付，我们无法访问您的密钥。"],
  "home.steps.4.title": ["هدیه در تلگرام می‌رسد", "تصل الهدية عبر تيليجرام", "The gift arrives on Telegram", "El regalo llega por Telegram", "礼物通过 Telegram 送达"],
  "home.steps.4.body": ["گیرنده کارت و یک کیف پول تازه با ۱۲ کلمه‌ی بازیابی می‌گیرد.", "يتلقى المستلم البطاقة ومحفظة جديدة مع ١٢ كلمة استعادة.", "The recipient gets the card and a new wallet with 12 recovery words.", "La persona recibe la tarjeta y una cartera nueva con 12 palabras de recuperación.", "收礼人会收到贺卡和一个附带 12 个助记词的新钱包。"],
  "home.trust.title": ["امنیت، بدون نگهداری", "الأمان دون حفظ أموالك", "Secure, without custody", "Seguridad sin custodia", "安全自托管"],
  "home.trust.1": ["کیف هدیه در مرورگر خود شما ساخته می‌شود و ۱۲ کلمه‌ی آن روی سرور ذخیره نمی‌شود.", "تُنشأ محفظة الهدية في متصفحك ولا تُحفظ كلماتها الـ١٢ على الخادم.", "The gift wallet is created in your browser. Its 12 words are never stored on our server.", "La cartera se crea en tu navegador. Sus 12 palabras nunca se guardan en nuestro servidor.", "礼物钱包在您的浏览器中创建，12 个助记词不会保存在服务器上。"],
  "home.trust.2": ["پرداخت از کیف پول خودتان انجام می‌شود و ما به موجودی دسترسی نداریم.", "يتم الدفع من محفظتك ولا نصل إلى رصيدك.", "Payment comes from your wallet. We cannot access your funds.", "El pago se realiza desde tu cartera. No podemos acceder a tus fondos.", "付款由您的钱包发起，我们无法访问您的资产。"],
  "home.trust.3": ["کارمزد سرویس ۰٫۵ دلار است و قبل از پرداخت دقیق نمایش داده می‌شود.", "رسوم الخدمة ٠٫٥ دولار وتُعرض بوضوح قبل الدفع.", "The service fee is $0.50 and is shown before payment.", "La tarifa del servicio es de 0,50 $ y se muestra antes de pagar.", "服务费为 0.50 美元，付款前会明确显示。"],
  "templates.title": ["قالب‌های کارت هدیه", "تصاميم بطاقات الهدايا", "Gift card designs", "Diseños de tarjetas de regalo", "礼品卡模板"],
  "cat.all": ["همه", "الكل", "All", "Todos", "全部"],
  "cat.birthday": ["تولد", "عيد الميلاد", "Birthday", "Cumpleaños", "生日"],
  "cat.thanks": ["تشکر", "شكر", "Thank you", "Agradecimiento", "感谢"],
  "cat.congrats": ["تبریک", "تهنئة", "Congratulations", "Felicitación", "祝贺"],
  "cat.love": ["عاشقانه", "حب", "Love", "Amor", "爱情"],
  "cat.eid": ["عید و مناسبت", "الأعياد والمناسبات", "Eid & occasions", "Fiestas y ocasiones", "节日与纪念日"],
  "cat.success": ["موفقیت و تحصیل", "النجاح والدراسة", "Success & study", "Éxito y estudios", "成功与学业"],
  "cat.family": ["ازدواج و نوزاد", "زواج ومولود", "Wedding & baby", "Boda y bebé", "婚礼与新生儿"],
  "cat.friend": ["دوستانه", "للأصدقاء", "For friends", "Amistad", "友情"],
  "cat.minimal": ["مینیمال", "بسيط", "Minimal", "Minimalista", "极简"],
  "cat.crypto": ["کریپتو", "كريبتو", "Crypto", "Cripto", "加密货币"],
  "tpl.birthday-cake": ["کیک خامه‌ای", "كعكة احتفالية", "Celebration cake", "Pastel de fiesta", "庆祝蛋糕"],
  "tpl.birthday-balloons": ["بادکنک‌های رنگی", "بالونات ملونة", "Colorful balloons", "Globos de colores", "彩色气球"],
  "tpl.birthday-photo-1": ["جشن صورتی", "احتفال وردي", "Soft pink celebration", "Celebración rosa", "柔粉庆典"],
  "tpl.birthday-photo-2": ["کیک طلایی", "كعكة ذهبية", "Golden candlelight", "Velas doradas", "金色烛光"],
  "tpl.birthday-photo-3": ["شبِ جشن", "ليلة احتفال", "Velvet birthday", "Cumpleaños aterciopelado", "绒金生日夜"],
  "tpl.birthday-photo-4": ["شکوه شمع‌ها", "وهج الشموع", "Bokeh & candles", "Luces y velas", "烛光流彩"],
  "tpl.birthday-photo-5": ["تولد طلایی", "ميلاد ذهبي", "Golden wishes", "Deseos dorados", "金色祝福"],
  "tpl.birthday-photo-6": ["جشنِ ستاره‌ای", "احتفال مرصّع بالنجوم", "Starlit birthday", "Cumpleaños estrellado", "星夜生日"],
  "tpl.birthday-photo-7": ["کیک و بادکنک طلایی", "كعكة وبالونات ذهبية", "Golden cake & balloons", "Pastel y globos dorados", "金色蛋糕与气球"],
  "tpl.thanks-olive": ["شاخه‌ی زیتون", "غصن زيتون", "Olive branch", "Rama de olivo", "橄榄枝"],
  "tpl.thanks-bouquet": ["دسته‌گل بهاری", "باقة ربيعية", "Spring bouquet", "Ramo primaveral", "春日花束"],
  "tpl.congrats-medal": ["مدال افتخار", "ميدالية الشرف", "Medal of honor", "Medalla de honor", "荣誉勋章"],
  "tpl.congrats-confetti": ["جشن رنگ‌ها", "احتفال بالألوان", "A burst of color", "Fiesta de colores", "缤纷庆典"],
  "tpl.love-birds": ["پرنده‌های عاشق", "طائران عاشقان", "Lovebirds", "Pájaros enamorados", "相依的小鸟"],
  "tpl.love-letter": ["نامه‌ی عاشقانه", "رسالة حب", "Love letter", "Carta de amor", "情书"],
  "tpl.love-rose-frame": ["قولِ رزگلد", "وعدة الورد الذهبي", "Rose-gold promise", "Promesa en oro rosa", "玫瑰金誓言"],
  "tpl.love-garden-couple": ["باغِ خیال", "حديقة الأحلام", "Garden of dreams", "Jardín de ensueño", "梦中花园"],
  "tpl.love-blossoms": ["زیر شکوفه‌ها", "تحت الأزهار", "Under the blossoms", "Bajo las flores", "花树之下"],
  "tpl.love-stardust-heart": ["قلبِ ستاره‌ای", "قلب من نجوم", "Stardust heart", "Corazón de estrellas", "星尘之心"],
  "tpl.love-persian-wedding": ["پیوند پارسی", "زفاف فارسي", "Persian wedding", "Boda persa", "波斯婚礼"],
  "tpl.eid-lanterns": ["ماه و فانوس", "قمر وفوانيس", "Moon & lanterns", "Luna y faroles", "明月与灯笼"],
  "tpl.eid-garden": ["باغ شبانه", "حديقة ليلية", "Night garden", "Jardín nocturno", "夜色花园"],
  "tpl.success-book": ["کلاه و کتاب", "قبعة وكتاب", "Cap & book", "Birrete y libro", "学士帽与书"],
  "tpl.success-mountain": ["قله‌ی موفقیت", "قمة النجاح", "Peak of success", "Cima del éxito", "成功之巅"],
  "tpl.family-rings": ["حلقه و شکوفه", "خاتمان وزهور", "Rings & blossoms", "Anillos y flores", "戒指与花朵"],
  "tpl.family-mobile": ["گهواره‌ی ستاره‌ها", "مهد النجوم", "A cradle of stars", "Cuna de estrellas", "星星摇篮"],
  "tpl.friend-coffee": ["قرارِ قهوه", "موعد قهوة", "Coffee date", "Cita para un café", "咖啡之约"],
  "tpl.friend-walk": ["هم‌مسیر", "رفيق الطريق", "Side by side", "En el mismo camino", "一路同行"],
  "tpl.minimal-arch": ["قوسِ روشن", "قوس مضيء", "Light arch", "Arco de luz", "光之拱门"],
  "tpl.minimal-lines": ["خط و نقطه", "خط ونقطة", "Line & point", "Línea y punto", "线与点"],
  "tpl.crypto-network": ["شبکه‌ی بلوکی", "شبكة الكتل", "Block network", "Red de bloques", "区块网络"],
  "tpl.crypto-chart": ["نمودار ماه", "مخطط صاعد", "Upward chart", "Gráfico ascendente", "上升趋势"],
  "create.template": ["قالب", "التصميم", "Design", "Diseño", "模板"],
  "create.change": ["تغییر قالب", "تغيير التصميم", "Change design", "Cambiar diseño", "更换模板"],
  "create.sender": ["اسم شما", "اسمك", "Your name", "Tu nombre", "您的姓名"],
  "create.receiver": ["اسم گیرنده", "اسم المستلم", "Recipient's name", "Nombre de quien recibe", "收礼人姓名"],
  "create.receiverId": ["شناسه‌ی عددی تلگرام گیرنده", "معرّف تيليجرام الرقمي للمستلم", "Recipient's numeric Telegram ID", "ID numérico de Telegram", "收礼人的 Telegram 数字 ID"],
  "create.check": ["بررسی", "تحقّق", "Check", "Comprobar", "检查"],
  "create.receiverHint": ["شناسه را از ربات @userinfobot بگیرید. گیرنده باید یک‌بار ربات @{bot} را استارت کرده باشد.", "احصل على المعرّف من @userinfobot. يجب أن يبدأ المستلم محادثة مع @{bot} أولاً.", "Get the ID from @userinfobot. The recipient must have started @{bot} once.", "Obtén el ID en @userinfobot. La persona debe haber iniciado @{bot} antes.", "请从 @userinfobot 获取 ID。收礼人需先启动过 @{bot}。"],
  "create.ready": ["گیرنده آماده‌ی دریافت است", "المستلم جاهز للاستلام", "Recipient is ready", "La persona ya puede recibirlo", "收礼人已准备好接收"],
  "create.notReady": ["گیرنده هنوز ربات را استارت نکرده. لینک ربات را برایش بفرستید و دوباره بررسی کنید.", "لم يبدأ المستلم المحادثة مع البوت بعد. أرسل له رابط البوت ثم أعد التحقق.", "The recipient has not started the bot yet. Send them its link, then check again.", "La persona aún no ha iniciado el bot. Envíale el enlace y vuelve a comprobarlo.", "收礼人尚未启动机器人。请发送机器人链接，然后重新检查。"],
  "create.token": ["ارز", "العملة", "Token", "Moneda", "代币"],
  "create.amount": ["مبلغ هدیه", "مبلغ الهدية", "Gift amount", "Importe del regalo", "礼物金额"],
  "create.cardText": ["متن روی کارت", "النص على البطاقة", "Text on the card", "Texto de la tarjeta", "贺卡文字"],
  "create.cardPlaceholder": ["مثلاً: تولدت مبارک!", "مثال: عيد ميلاد سعيد!", "For example: Happy birthday!", "Por ejemplo: ¡Feliz cumpleaños!", "例如：生日快乐！"],
  "create.personalMessage": ["پیام شخصی (در تلگرام)", "رسالة شخصية (على تيليجرام)", "Personal message (on Telegram)", "Mensaje personal (en Telegram)", "私人留言（通过 Telegram 发送）"],
  "create.font": ["فونت متن کارت", "خط البطاقة", "Card font", "Tipografía de la tarjeta", "贺卡字体"],
  "create.fontModern": ["مدرن", "حديث", "Modern", "Moderna", "现代"],
  "create.fontClassic": ["کلاسیک", "كلاسيكي", "Classic", "Clásica", "经典"],
  "create.fontClean": ["ساده", "بسيط", "Clean", "Sencilla", "简洁"],
  "create.textSize": ["اندازه‌ی متن", "حجم النص", "Text size", "Tamaño del texto", "文字大小"],
  "create.rotation": ["چرخش متن", "تدوير النص", "Text rotation", "Rotación del texto", "文字旋转"],
  "create.textEditorTitle": ["جایگاه و رنگ نوشته‌ها", "موضع النصوص وألوانها", "Text position & color", "Posición y color del texto", "文字位置与颜色"],
  "create.textEditorHint": ["لایه را انتخاب کنید و روی پیش‌نمایش بکشید، یا جای آن را با مختصات تنظیم کنید.", "اختر طبقة واسحبها على المعاينة، أو اضبط موضعها بالإحداثيات.", "Choose a layer and drag it on the preview, or fine-tune its coordinates.", "Elige una capa y arrástrala en la vista previa, o ajusta sus coordenadas.", "选择文字图层并在预览中拖动，也可精确调整坐标。"],
  "create.textLayer": ["نوشته برای ویرایش", "النص المراد تعديله", "Text layer", "Capa de texto", "文字图层"],
  "create.layer.brand": ["نام برند", "اسم العلامة", "Brand", "Marca", "品牌"],
  "create.layer.category": ["مناسبت", "المناسبة", "Occasion", "Ocasión", "场合"],
  "create.layer.receiver": ["نام گیرنده", "اسم المستلم", "Recipient", "Destinatario", "收礼人"],
  "create.layer.sender": ["نام فرستنده", "اسم المرسل", "Sender", "Remitente", "送礼人"],
  "create.layer.amount": ["مبلغ و ارز", "المبلغ والعملة", "Amount & token", "Importe y moneda", "金额与代币"],
  "create.layer.message": ["پیام کارت", "رسالة البطاقة", "Greeting", "Dedicatoria", "贺卡祝福"],
  "create.layer.network": ["شبکه", "الشبكة", "Network", "Red", "网络"],
  "create.textColor": ["رنگ نوشته", "لون النص", "Text color", "Color del texto", "文字颜色"],
  "create.positionX": ["جای افقی (X)", "الموضع الأفقي (X)", "Horizontal position (X)", "Posición horizontal (X)", "水平位置 (X)"],
  "create.positionY": ["جای عمودی (Y)", "الموضع العمودي (Y)", "Vertical position (Y)", "Posición vertical (Y)", "垂直位置 (Y)"],
  "create.resetPosition": ["بازنشانی جای این نوشته", "إعادة موضع هذا النص", "Reset this layer", "Restablecer esta capa", "重置此图层"],
  "create.gas": ["{amount} BNB هم برای کارمزد انتقال گیرنده داخل کیف بگذار (پیشنهاد می‌شود)", "أضف {amount} BNB لرسوم التحويل في محفظة المستلم (موصى به)", "Add {amount} BNB for the recipient's transfer fee (recommended)", "Añade {amount} BNB para la comisión de envío de quien recibe (recomendado)", "同时向收礼人钱包转入 {amount} BNB 作为转账手续费（推荐）"],
  "create.summaryGift": ["هدیه", "الهدية", "Gift", "Regalo", "礼物"],
  "create.serviceFee": ["کارمزد سرویس", "رسوم الخدمة", "Service fee", "Tarifa del servicio", "服务费"],
  "create.gasFee": ["BNB برای کارمزد گیرنده", "BNB لرسوم المستلم", "Recipient gas", "Gas para quien recibe", "收礼人手续费"],
  "create.total": ["جمع از کیف شما", "الإجمالي من محفظتك", "Total from your wallet", "Total desde tu cartera", "钱包支付总额"],
  "create.security": ["گیرنده یک کیف پول تازه با ۱۲ کلمه‌ی بازیابی می‌گیرد و یک نسخه از همان کلمات برای شما هم فرستاده می‌شود. هرکس این کلمات را داشته باشد صاحب موجودی است؛ این کلمات روی سرور ذخیره نمی‌شوند.", "يتلقى المستلم محفظة جديدة مع ١٢ كلمة استعادة، وتُرسل نسخة إليك أيضًا. من يملك هذه الكلمات يملك الرصيد؛ ولا تُحفظ على خوادمنا.", "The recipient gets a new wallet with 12 recovery words, and you also receive a copy. Anyone with these words controls the funds; they are never stored on our server.", "La persona recibe una cartera nueva con 12 palabras de recuperación y tú también recibes una copia. Quien tenga esas palabras controla los fondos; nunca se guardan en nuestro servidor.", "收礼人会收到一个附有 12 个助记词的新钱包，您也会收到一份副本。持有这些助记词即可控制资金；它们不会存储在服务器上。"],
  "create.login": ["برای ارسال هدیه ابتدا با تلگرام وارد شوید.", "سجّل الدخول عبر تيليجرام لإرسال الهدية.", "Log in with Telegram to send a gift.", "Inicia sesión con Telegram para enviar un regalo.", "请先使用 Telegram 登录以发送礼物。"],
  "create.connect": ["اتصال کیف پول", "اتصال المحفظة", "Connect wallet", "Conectar cartera", "连接钱包"],
  "create.noWallet": ["کیف پولی پیدا نشد. این صفحه را در مرورگر Rabby، Trust Wallet یا MetaMask باز کنید؛ در رایانه می‌توانید افزونه‌ی Rabby را نصب کنید.", "لم يتم العثور على محفظة. افتح الصفحة في متصفح Rabby أو Trust Wallet أو MetaMask.", "No wallet found. Open this page in Rabby, Trust Wallet, or MetaMask, or install the Rabby browser extension on desktop.", "No encontramos una cartera. Abre esta página en Rabby, Trust Wallet o MetaMask, o instala la extensión Rabby en el ordenador.", "未找到钱包。请在 Rabby、Trust Wallet 或 MetaMask 浏览器中打开此页面，或在电脑上安装 Rabby 扩展。"],
  "create.copyLink": ["کپی لینک این صفحه", "نسخ رابط الصفحة", "Copy page link", "Copiar enlace", "复制页面链接"],
  "create.pay": ["پرداخت {total} {token} و ارسال هدیه", "ادفع {total} {token} وأرسل الهدية", "Pay {total} {token} and send gift", "Pagar {total} {token} y enviar regalo", "支付 {total} {token} 并发送礼物"],
  "create.busy": ["در حال انجام… این صفحه را نبندید", "جارٍ التنفيذ… لا تغلق الصفحة", "Working… Keep this page open", "Procesando… No cierres esta página", "处理中…请勿关闭此页面"],
  "create.wallet": ["کیف پول", "المحفظة", "Wallet", "Cartera", "钱包"],
  "create.pending": ["یک هدیه‌ی نیمه‌کاره دارید", "لديك هدية غير مكتملة", "You have an unfinished gift", "Tienes un regalo sin terminar", "您有一份未完成的礼物"],
  "create.notPaid": ["هنوز پرداختی انجام نشده است.", "لم يتم الدفع بعد.", "No payment has been made yet.", "Aún no se ha realizado el pago.", "尚未付款。"],
  "create.alreadyStarted": ["پرداخت شروع شده است. با «ادامه» سفارش کامل می‌شود.", "بدأ الدفع. اضغط «متابعة» لإكمال الطلب.", "Payment has started. Choose Continue to finish the order.", "El pago ha comenzado. Pulsa Continuar para terminar el pedido.", "付款已开始。点击“继续”完成订单。"],
  "create.continue": ["ادامه‌ی سفارش", "متابعة الطلب", "Continue order", "Continuar pedido", "继续订单"],
  "create.showWords": ["نمایش ۱۲ کلمه‌ی کیف", "عرض كلمات المحفظة الـ١٢", "Show 12 wallet words", "Mostrar 12 palabras", "显示 12 个助记词"],
  "create.hideWords": ["پنهان کردن ۱۲ کلمه", "إخفاء الكلمات الـ١٢", "Hide 12 words", "Ocultar 12 palabras", "隐藏助记词"],
  "create.delete": ["حذف", "حذف", "Delete", "Eliminar", "删除"],
  "create.sent": ["هدیه ارسال شد", "تم إرسال الهدية", "Gift sent", "Regalo enviado", "礼物已发送"],
  "create.failed": ["پرداخت انجام شد، ولی ارسال به گیرنده ناموفق بود", "تم الدفع، لكن تعذر الإرسال إلى المستلم", "Payment succeeded, but delivery to the recipient failed", "El pago se realizó, pero no se pudo entregar", "付款成功，但发送给收礼人失败"],
  "create.sentInfo": ["کارت و کیف پول جدید برای {name} در تلگرام فرستاده شد.", "أُرسلت البطاقة والمحفظة الجديدة إلى {name} عبر تيليجرام.", "The card and new wallet were sent to {name} on Telegram.", "La tarjeta y la nueva cartera se enviaron a {name} por Telegram.", "贺卡和新钱包已通过 Telegram 发送给 {name}。"],
  "create.failedInfo": ["گیرنده نتوانست پیام را بگیرد (شاید ربات را مسدود کرده باشد). موجودی در کیف زیر امن است؛ ۱۲ کلمه را خودتان برایش بفرستید.", "تعذر وصول الرسالة إلى المستلم (ربما حظر البوت). الرصيد آمن في المحفظة أدناه؛ أرسل إليه الكلمات الـ١٢ بنفسك.", "The recipient could not receive the message (they may have blocked the bot). Funds are safe in the wallet below; send them the 12 words yourself.", "No se pudo entregar el mensaje (quizá bloqueó el bot). Los fondos están seguros en la cartera; envíale las 12 palabras por tu cuenta.", "收礼人无法收到消息（可能屏蔽了机器人）。资金安全地保存在下方钱包中，请自行将 12 个助记词发送给对方。"],
  "create.senderCopy": ["یک نسخه از ۱۲ کلمه هم برای شما در تلگرام فرستاده شد.", "أُرسلت إليك نسخة من الكلمات الـ١٢ عبر تيليجرام أيضًا.", "A copy of the 12 words was also sent to you on Telegram.", "También te enviamos una copia de las 12 palabras por Telegram.", "12 个助记词的副本也已通过 Telegram 发送给您。"],
  "create.order": ["کد سفارش", "رقم الطلب", "Order ID", "N.º de pedido", "订单号"],
  "create.backup": ["نسخه‌ی پشتیبان (فقط برای شما)", "نسخة احتياطية (لك فقط)", "Backup (for you only)", "Copia de seguridad (solo para ti)", "备份（仅供您使用）"],
  "create.reveal": ["نمایش ۱۲ کلمه", "عرض الكلمات الـ١٢", "Show 12 words", "Mostrar 12 palabras", "显示 12 个助记词"],
  "create.copyWords": ["کپی ۱۲ کلمه", "نسخ الكلمات الـ١٢", "Copy 12 words", "Copiar 12 palabras", "复制 12 个助记词"],
  "create.bscscan": ["تراکنش در BscScan", "المعاملة على BscScan", "Transaction on BscScan", "Transacción en BscScan", "在 BscScan 查看交易"],
  "create.another": ["ساخت هدیه‌ی دیگر", "إنشاء هدية أخرى", "Create another gift", "Crear otro regalo", "再创建一份礼物"],
  "create.validateNames": ["اسم شما و اسم گیرنده را بنویسید.", "أدخل اسمك واسم المستلم.", "Enter your name and the recipient's name.", "Escribe tu nombre y el de quien recibe.", "请填写您和收礼人的姓名。"],
  "create.validateId": ["شناسه‌ی عددی تلگرام گیرنده را درست وارد کنید.", "أدخل معرّف تيليجرام الرقمي بشكل صحيح.", "Enter a valid numeric Telegram ID.", "Introduce un ID numérico de Telegram válido.", "请输入有效的 Telegram 数字 ID。"],
  "create.validateAmount": ["مبلغ باید بین {min} تا {max} {token} باشد.", "يجب أن يكون المبلغ بين {min} و{max} {token}.", "Amount must be between {min} and {max} {token}.", "El importe debe estar entre {min} y {max} {token}.", "金额必须介于 {min} 到 {max} {token} 之间。"],
  "create.walletConnectFailed": ["اتصال کیف پول انجام نشد.", "تعذر الاتصال بالمحفظة.", "Wallet connection failed.", "No se pudo conectar la cartera.", "钱包连接失败。"],
  "create.connectFirst": ["اول کیف پول را وصل کنید.", "اتصل بالمحفظة أولاً.", "Connect your wallet first.", "Conecta primero tu cartera.", "请先连接钱包。"],
  "create.sameWallet": ["با همان کیف پولی که سفارش را شروع کردید وارد شوید.", "استخدم المحفظة نفسها التي بدأت بها الطلب.", "Reconnect the same wallet you used to start this order.", "Conecta la misma cartera con la que empezaste el pedido.", "请连接开始此订单时使用的同一个钱包。"],
  "gifts.title": ["هدیه‌های من", "هداياي", "My gifts", "Mis regalos", "我的礼物"],
  "gifts.login": ["برای دیدن هدیه‌هایتان با تلگرام وارد شوید.", "سجّل الدخول عبر تيليجرام لرؤية هداياك.", "Log in with Telegram to see your gifts.", "Inicia sesión con Telegram para ver tus regalos.", "请使用 Telegram 登录以查看您的礼物。"],
  "gifts.empty": ["هنوز هدیه‌ای نفرستاده‌اید.", "لم ترسل أي هدية بعد.", "You have not sent any gifts yet.", "Aún no has enviado regalos.", "您还没有发送过礼物。"],
  "gifts.first": ["اولین هدیه را بسازید", "أنشئ أول هدية", "Create your first gift", "Crea tu primer regalo", "创建您的第一份礼物"],
  "gifts.delivered": ["تحویل شد", "تم التسليم", "Delivered", "Entregado", "已送达"],
  "gifts.failed": ["ارسال به گیرنده ناموفق", "تعذر الإرسال إلى المستلم", "Delivery failed", "No se pudo entregar", "发送给收礼人失败"],
  "card.for": ["برای {name}", "إلى {name}", "For {name}", "Para {name}", "送给{name}"],
  "card.from": ["از طرف {name}", "من {name}", "From {name}", "De {name}", "来自{name}"],
  "card.toEmpty": ["برای ...", "إلى ...", "For ...", "Para ...", "送给……"],
  "card.fromEmpty": ["از طرف ...", "من ...", "From ...", "De ...", "来自……"],
  "card.default": ["یک هدیه‌ی کوچک برای تو", "هدية صغيرة لك", "A little something for you", "Un pequeño detalle para ti", "送你一份小小心意"],
  "card.category": ["هدیه‌ی دیجیتال", "هدية رقمية", "Digital gift", "Regalo digital", "数字礼物"],
  "validation.title": ["موجودی کیف پول را بررسی می‌کنیم", "جارٍ التحقق من رصيد المحفظة", "Checking wallet balance", "Comprobando saldo", "正在检查钱包余额"],
  "validation.gift": ["پرداخت هدیه به کیف جدید را در کیف پول تأیید کنید", "أكد تحويل الهدية إلى المحفظة الجديدة", "Approve the gift payment to the new wallet", "Confirma el pago del regalo a la nueva cartera", "请在钱包中确认转入新钱包的礼物款项"],
  "validation.fee": ["پرداخت کارمزد سرویس", "دفع رسوم الخدمة", "Pay service fee", "Pagar tarifa del servicio", "支付服务费"],
  "validation.gas": ["ارسال کمی BNB برای کارمزد گیرنده", "إرسال بعض BNB لرسوم المستلم", "Send BNB for the recipient's fee", "Enviar BNB para la comisión de quien recibe", "转入少量 BNB 作为收礼人手续费"],
  "validation.deliver": ["ساخت کارت و ارسال در تلگرام", "إنشاء البطاقة وإرسالها عبر تيليجرام", "Create card and send on Telegram", "Crear la tarjeta y enviarla por Telegram", "生成贺卡并通过 Telegram 发送"],
  "error.network": ["ارتباط با سرور برقرار نشد. اینترنت را بررسی کنید.", "تعذر الاتصال بالخادم. تحقق من الإنترنت.", "Could not reach the server. Check your internet connection.", "No se pudo conectar con el servidor. Revisa tu conexión.", "无法连接服务器，请检查网络。"],
  "error.auth": ["ابتدا با تلگرام وارد شوید.", "سجّل الدخول عبر تيليجرام أولاً.", "Log in with Telegram first.", "Inicia sesión con Telegram primero.", "请先使用 Telegram 登录。"],
  "error.receiver_not_started": ["گیرنده هنوز ربات را استارت نکرده است.", "لم يبدأ المستلم المحادثة مع البوت بعد.", "The recipient has not started the bot yet.", "La persona aún no ha iniciado el bot.", "收礼人尚未启动机器人。"],
  "error.bad_amount": ["مبلغ مجاز نیست.", "المبلغ غير صالح.", "This amount is not allowed.", "El importe no es válido.", "金额无效。"],
  "error.bad_receiver": ["شناسه‌ی گیرنده درست نیست.", "معرّف المستلم غير صحيح.", "Recipient ID is invalid.", "El ID de quien recibe no es válido.", "收礼人 ID 无效。"],
  "error.draft_expired": ["مهلت سفارش تمام شده است. عبارت بازیابی را ذخیره کنید و با پشتیبانی تماس بگیرید.", "انتهت صلاحية الطلب. احفظ عبارة الاستعادة واتصل بالدعم.", "This order expired. Save the recovery phrase and contact support.", "El pedido ha caducado. Guarda la frase de recuperación y contacta con soporte.", "订单已过期。请保存助记词并联系支持。"],
  "error.payment_failed": ["یکی از تراکنش‌ها ناموفق بود.", "فشلت إحدى المعاملات.", "A transaction failed.", "Una transacción falló.", "有一笔交易失败。"],
  "error.gift_payment_mismatch": ["تراکنش هدیه با سفارش مطابقت ندارد.", "معاملة الهدية لا تطابق الطلب.", "Gift transaction does not match the order.", "La transacción del regalo no coincide con el pedido.", "礼物交易与订单不匹配。"],
  "error.fee_payment_mismatch": ["تراکنش کارمزد با سفارش مطابقت ندارد.", "معاملة الرسوم لا تطابق الطلب.", "Fee transaction does not match the order.", "La transacción de la tarifa no coincide con el pedido.", "手续费交易与订单不匹配。"],
  "error.gas_payment_mismatch": ["تراکنش BNB با سفارش مطابقت ندارد.", "معاملة BNB لا تطابق الطلب.", "BNB transaction does not match the order.", "La transacción de BNB no coincide con el pedido.", "BNB 交易与订单不匹配。"],
  "error.tx_reused": ["این تراکنش‌ها قبلاً برای سفارش دیگری استفاده شده‌اند.", "استُخدمت هذه المعاملات لطلب آخر من قبل.", "These transactions were already used for another order.", "Estas transacciones ya se usaron en otro pedido.", "这些交易已用于其他订单。"],
  "error.rpc_unavailable": ["شبکه‌ی BNB Chain اکنون پاسخ نمی‌دهد. کمی بعد دوباره امتحان کنید.", "شبكة BNB Chain لا تستجيب الآن. حاول مجددًا بعد قليل.", "BNB Chain is not responding right now. Try again shortly.", "BNB Chain no responde ahora. Inténtalo de nuevo pronto.", "BNB Chain 暂时无响应，请稍后重试。"],
  "error.not_configured": ["سرویس هنوز کامل راه‌اندازی نشده است.", "لم يكتمل إعداد الخدمة بعد.", "The service is not fully configured yet.", "El servicio aún no está configurado por completo.", "服务尚未完成配置。"],
  "error.unknown": ["خطای ناشناخته", "خطأ غير معروف", "Unknown error", "Error desconocido", "未知错误"],
  "error.cancelled": ["در کیف پول لغو شد.", "أُلغيت العملية في المحفظة.", "Cancelled in wallet.", "Cancelado en la cartera.", "已在钱包中取消。"],
  "error.noWallet": ["کیف پولی پیدا نشد.", "لم يتم العثور على محفظة.", "No wallet found.", "No se encontró una cartera.", "未找到钱包。"],
  "error.txFailed": ["تراکنش در شبکه ناموفق بود.", "فشلت المعاملة على الشبكة.", "The network transaction failed.", "La transacción de red falló.", "网络交易失败。"],
  "error.txTimeout": ["تأیید تراکنش بیش از حد طول کشید. کمی بعد سفارش را ادامه دهید.", "استغرق تأكيد المعاملة وقتًا طويلًا. تابع الطلب بعد قليل.", "Transaction confirmation took too long. Resume the order shortly.", "La confirmación tardó demasiado. Reanuda el pedido en un momento.", "交易确认超时，请稍后继续订单。"],
  "error.insufficient_token": ["موجودی توکن برای هدیه و کارمزد کافی نیست.", "رصيد العملة غير كافٍ للهدية والرسوم.", "Not enough tokens for the gift and fee.", "No hay suficientes tokens para el regalo y la tarifa.", "代币余额不足以支付礼物和手续费。"],
  "error.insufficient_bnb": ["موجودی BNB برای کارمزد شبکه کافی نیست.", "رصيد BNB غير كافٍ لرسوم الشبكة.", "Not enough BNB for the network fee.", "No hay suficiente BNB para la comisión de red.", "BNB 余额不足以支付网络手续费。"]
};

const LANGUAGE_INDEX: Record<Language, number> = { fa: 0, ar: 1, en: 2, es: 3, zh: 4 };
const LANGUAGE_KEY = "ramo_gift_language";

export function translate(language: Language, key: string, values: Record<string, string | number> = {}) {
  let text = MESSAGES[key]?.[LANGUAGE_INDEX[language]] ?? MESSAGES[key]?.[2] ?? key;
  for (const [name, value] of Object.entries(values)) text = text.split(`{${name}}`).join(String(value));
  return text;
}

function initialLanguage(): Language {
  const stored = localStorage.getItem(LANGUAGE_KEY);
  if (stored && stored in LANGUAGE_INDEX) return stored as Language;
  const telegram = (window as any).Telegram?.WebApp?.initDataUnsafe?.user?.language_code;
  const preferred = String(telegram || navigator.language || "en").toLowerCase();
  if (preferred.startsWith("fa")) return "fa";
  if (preferred.startsWith("ar")) return "ar";
  if (preferred.startsWith("es")) return "es";
  if (preferred.startsWith("zh")) return "zh";
  return "en";
}

type LanguageContextValue = { language: Language; setLanguage: (language: Language) => void; t: (key: string, values?: Record<string, string | number>) => string };
const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(initialLanguage);
  const setLanguage = (value: Language) => {
    localStorage.setItem(LANGUAGE_KEY, value);
    setLanguageState(value);
  };
  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === "fa" || language === "ar" ? "rtl" : "ltr";
    document.title = translate(language, "app.title");
  }, [language]);
  return <LanguageContext.Provider value={{ language, setLanguage, t: (key, values) => translate(language, key, values) }}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const value = useContext(LanguageContext);
  if (!value) throw new Error("useLanguage must be used inside LanguageProvider");
  return value;
}
