import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Send,
  BotMessageSquare,
  Sparkles,
  Zap,
  Brain,
  RotateCcw,
  User,
  Loader2,
  Copy,
  Check,
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { ChatMessage } from '../types/inventory';

interface AICopilotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

// Helper to cleanly format inline text and strip ugly asterisks
const formatInlineText = (text: string) => {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      const inner = part.slice(2, -2).replace(/\*/g, '');
      return (
        <strong key={i} className="font-bold text-slate-950 dark:text-white">
          {inner}
        </strong>
      );
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code
          key={i}
          className="px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-amber-800 dark:text-amber-300 font-mono text-[11px]"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    // Clean out stray single/double/triple asterisks
    const cleaned = part.replace(/\*{1,3}/g, '');
    return <React.Fragment key={i}>{cleaned}</React.Fragment>;
  });
};

const renderFormattedContent = (content: string, isUserMessage: boolean) => {
  if (isUserMessage) {
    return <div className="whitespace-pre-line">{content}</div>;
  }

  const lines = content.split('\n');
  return (
    <div className="space-y-1.5 text-xs leading-relaxed">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <div key={idx} className="h-1" />;
        }

        // Headers like ### Header or ## Header
        if (/^#{1,4}\s+/.test(trimmed)) {
          const text = trimmed.replace(/^#{1,4}\s+/, '');
          return (
            <div key={idx} className="font-bold text-amber-700 dark:text-amber-400 text-xs pt-1 uppercase tracking-wider">
              {formatInlineText(text)}
            </div>
          );
        }

        // Bullet lists starting with * or - or • or Ethiopic dash
        if (/^(\*|-|•|⁃|–|—)\s+/.test(trimmed)) {
          const text = trimmed.replace(/^(\*|-|•|⁃|–|—)\s+/, '');
          return (
            <div key={idx} className="flex items-start gap-1.5 pl-1">
              <span className="text-amber-500 font-bold shrink-0 mt-0.5">•</span>
              <span className="flex-1">{formatInlineText(text)}</span>
            </div>
          );
        }

        // Numbered lists: 1. or 2. or Ethiopic ፩. ፪. ፫.
        const numMatch = trimmed.match(/^([0-9]+|[፩-፲]+)[.)፦]\s+(.*)/);
        if (numMatch) {
          const [, num, text] = numMatch;
          return (
            <div key={idx} className="flex items-start gap-1.5 pl-1">
              <span className="font-mono text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-500/10 px-1 py-0.2 rounded shrink-0 mt-0.5">
                {num}
              </span>
              <span className="flex-1">{formatInlineText(text)}</span>
            </div>
          );
        }

        return <div key={idx}>{formatInlineText(trimmed)}</div>;
      })}
    </div>
  );
};

export const AICopilotDrawer: React.FC<AICopilotDrawerProps> = ({ isOpen, onClose }) => {
  const { items, suppliers, purchaseOrders, warehouses, businessType, language, t } = useInventory();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [modelMode, setModelMode] = useState<'general' | 'fast' | 'complex'>('general');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const nicheBadgeMap: Record<string, string> = {
    pharmacy: t('biz_pharmacy_title') || 'Pharmacy',
    building: t('biz_building_title') || 'Building Materials',
    supermarket: t('biz_supermarket_title') || 'Supermarket',
    minimarket: t('biz_minimarket_title') || 'Minimarket',
    shop: t('biz_shop_title') || 'Retail Shop',
    store: t('biz_store_title') || 'Wholesale Depot',
    other: t('biz_other_title') || 'General Commerce',
  };
  const activeNicheLabel = nicheBadgeMap[businessType] || businessType.toUpperCase();

  // Dynamic welcome message matching active language and niche
  const getWelcomeMessage = () => {
    const totalValuationETB = Math.round(items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0)).toLocaleString();
    switch (language) {
      case 'am':
        return `ሰላም! እኔ **ጥሪት ኮፓይለት (Terit Copilot)** ነኝ — ለ**${activeNicheLabel}** ስራ የተዘጋጀው የእርስዎ የክምችትና የአቅርቦት ሰንሰለት AI ረዳት።

በአሁኑ ወቅት **${items.length} ምርቶች** (ጠቅላላ ዋጋ **${totalValuationETB} ETB**)፣ **${suppliers.length} አቅራቢዎች** እና **${purchaseOrders.length} የግዢ ማዘዣዎችን** እየተከታተልኩ ነው።

በአማርኛ፣ በAfaan Oromoo፣ በትግርኛ፣ በAf Soomaali ወይም በEnglish መጠየቅ ይችላሉ። ዛሬ የንግድ ስራዎን በምን ልርዳዎት?`;
      case 'om':
        return `Akkam! Ani **Terit Copilot**, gargaaraa AI kan qabeenya kuusaa fi daldala **${activeNicheLabel}** keessaniiti.

Yeroo ammaa kana **meeshaalee ${items.length}** (gatii **${totalValuationETB} ETB**), **dhiyeessitoota ${suppliers.length}** fi **ajajoota bittaa ${purchaseOrders.length}** to'achaan jira.

Afaan Oromoo, አማርኛ, ትግርኛ, Af Soomaali yookiin English dhaan na dubbisuu dandeessu. Har'a daldala keessan maal isin gargaaruu danda'a?`;
      case 'ti':
        return `ሰላም! ኣነ **ጥሪት ኮፓይለት (Terit Copilot)** እየ — ን**${activeNicheLabel}** ዝተዳለወ ናይ AI ክምችትን ዕድጊትን መማኸሪ ረዳትኩም።

ኣብዚ ሕጂ እዋን **${items.length} ዓይነታት ኣቑሑት** (ጠቕላላ ዋጋ **${totalValuationETB} ETB**)፣ **${suppliers.length} ኣቕረብትን** **${purchaseOrders.length} ናይ ዕድጊት ትእዛዛትን** ይከታተል ኣለኹ።

ብትግርኛ፣ በአማርኛ፣ ብAfaan Oromoo፣ ብAf Soomaali ወይ ብEnglish ክትዛረቡኒ ትኽእሉ ኢኹም። ሎሚ ንግድኹም ብምንታይ ክሕግዘኩም?`;
      case 'so':
        return `Kusoo dhawoow! Waxaan ahay **Terit Copilot**, kaaliyahaaga AI ee maareynta kaydka iyo howlaha **${activeNicheLabel}**.

Hadda waxaan la socdaa **${items.length} nooc oo alaab ah** (qiimaha guud **${totalValuationETB} ETB**), **${suppliers.length} qeybiyaha** iyo **${purchaseOrders.length} dalab oo iib ah**.

Waxaad igula hadli kartaa Af Soomaali, English, አማርኛ, Afaan Oromoo, ama ትግርኛ. Sideen maanta ganacsigaaga kuu caawin karaa?`;
      default:
        return `Hello! I am **Terit Copilot**, your sector-trained AI inventory & operations specialist for **${activeNicheLabel}**.

I am currently tracking **${items.length} live SKUs** (**${totalValuationETB} ETB** retail value), **${suppliers.length} suppliers**, and **${purchaseOrders.length} purchase orders**.

Ask me in **English**, **አማርኛ**, **Afaan Oromoo**, **ትግርኛ**, or **Af Soomaali** about pricing margins in ETB, restock points, batch safety, or supplier POs.`;
    }
  };

  // Initialize / refresh welcome message cleanly when business model or language switches on a fresh thread
  useEffect(() => {
    if (messages.length === 0 || (messages.length === 1 && messages[0].id.startsWith('welcome'))) {
      setMessages([
        {
          id: 'welcome',
          role: 'model',
          content: getWelcomeMessage(),
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }
  }, [businessType, items.length, suppliers.length, purchaseOrders.length, language]);

  // Auto-scroll to bottom of thread
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const nowMs = Date.now();
  const nearExpirySKUs = items
    .filter((i) => i.expiryDate && (new Date(i.expiryDate).getTime() - nowMs) / (1000 * 3600 * 24) <= 120)
    .map((i) => ({
      name: i.name,
      sku: i.sku,
      batch: i.batchNumber,
      expiryDate: i.expiryDate,
      quantity: i.quantity,
      valueETB: Math.round(i.quantity * i.unitPrice),
    }));

  const categorySummary = items.reduce<Record<string, { skus: number; units: number; retailETB: number }>>((acc, item) => {
    const key = item.category || 'General';
    if (!acc[key]) acc[key] = { skus: 0, units: 0, retailETB: 0 };
    acc[key].skus += 1;
    acc[key].units += item.quantity;
    acc[key].retailETB += Math.round(item.quantity * item.unitPrice);
    return acc;
  }, {});

  // Live ETB inventory snapshot sent to Terit Copilot
  const inventoryContext = {
    currency: 'ETB',
    businessType,
    totalSKUs: items.length,
    totalUnits: items.reduce((s, i) => s + i.quantity, 0),
    totalRetailValueETB: Math.round(items.reduce((s, i) => s + i.quantity * i.unitPrice, 0)),
    totalCostValueETB: Math.round(items.reduce((s, i) => s + i.quantity * i.costPrice, 0)),
    warehouses: warehouses.map((w) => w.name),
    categoryBreakdown: categorySummary,
    activeSKUs: items.slice(0, 15).map((i) => ({
      name: i.name,
      sku: i.sku,
      qty: i.quantity,
      uom: i.unitOfMeasure,
      minAlert: i.minStockAlert,
      costETB: i.costPrice,
      priceETB: i.unitPrice,
      location: i.location,
      supplier: i.supplierName,
      expiry: i.expiryDate,
    })),
    lowStockSKUs: items
      .filter((i) => i.status === 'low_stock')
      .map((i) => ({
        name: i.name,
        sku: i.sku,
        quantity: i.quantity,
        minAlert: i.minStockAlert,
        supplier: i.supplierName,
        unitCostETB: i.costPrice,
        expiryDate: i.expiryDate,
        batchNumber: i.batchNumber,
      })),
    outOfStockSKUs: items
      .filter((i) => i.status === 'out_of_stock')
      .map((i) => ({
        name: i.name,
        sku: i.sku,
        supplier: i.supplierName,
      })),
    nearExpiryBatches: nearExpirySKUs,
    openPurchaseOrders: purchaseOrders.filter((p) => p.status === 'ordered').length,
    vendors: suppliers.map((s) => ({ name: s.name, leadTimeDays: s.leadTimeDays })),
  };

  const handleSend = async (overridePrompt?: string) => {
    const textToSend = (overridePrompt || input).trim();
    if (!textToSend || loading) return;

    const userMessage: ChatMessage = {
      id: 'msg-' + Date.now(),
      role: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newHistory = [...messages, userMessage];
    setMessages(newHistory);
    setInput('');
    setLoading(true);

    // Filter out client-side welcome message to prevent English language bias
    const apiMessages = newHistory
      .filter((m) => !m.id.startsWith('welcome'))
      .map((m) => ({
        role: m.role,
        content: m.content,
      }));

    try {
      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: apiMessages.length > 0 ? apiMessages : [{ role: 'user', content: textToSend }],
          modelMode,
          inventoryContext,
          language,
          businessType,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with ${res.status}`);
      }

      const data = await res.json();
      const botReply: ChatMessage = {
        id: 'reply-' + Date.now(),
        role: 'model',
        content: data.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botReply]);
    } catch (err: any) {
      console.error('Chat error:', err);
      const errorReply: ChatMessage = {
        id: 'err-' + Date.now(),
        role: 'model',
        content: err?.message ? `${t('copilot_error_fallback')} (${err.message})` : t('copilot_error_fallback'),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorReply]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (content: string, id: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const clearChat = () => {
    setMessages([
      {
        id: 'welcome-' + Date.now(),
        role: 'model',
        content: getWelcomeMessage(),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  const getBusinessPrompts = () => {
    if (language === 'am') {
      switch (businessType) {
        case 'pharmacy':
          return [
            'ሊያልቁ የቀረቡ መድኃኒቶችን መርምርና የETB የግዢ በጀት አስላ',
            'የኢንሱሊንና የ2–8°C ቀዝቃዛ መድኃኒቶች አያያዝ መመሪያን አብራራ',
            'ለፈጣን የህመም ማስታገሻዎች የዳግም ግዢ ነጥብ (ROP) አስላ',
            'የፋርማሲ ብክነትንና የEFDA ባች ስህተትን እንዴት እንቀንሳለን?',
          ];
        case 'building':
          return [
            'የ12ሚሜ ፌሮ ብረትና የሲሚንቶ ክምችት ዋጋ በETB አስላ',
            'የሲሚንቶ የእርጥበት መጠበቂያና የFIFO አወጣጥ እቅድ አዘጋጅ',
            'ለ11 ቶን አይሱዙ መኪና የሲሚንቶና የብሎኬት ጭነት መጠን መርምር',
            'ለግንባታ ተቋራጮች የጅምላ ብድርና የግዢ ማዘዣ ምክር ስጥ',
          ];
        case 'supermarket':
          return [
            'የወተት፣ ዳቦና አትክልት የመበላሸት ስጋትን መርምርና ምክር ስጥ',
            'ለሳምንቱ መጨረሻ ከፍተኛ ሽያጭ የመደርደሪያ ማደራጃ መርሃ-ግብር አዘጋጅ',
            'የምግብ ዘይትና ሩዝ የትርፍ ህዳግ በETB አስላ',
            'ለጅምላ አቅራቢዎች የሚላክ የግዢ ማዘዣ ረቂቅ ጻፍ',
          ];
        case 'minimarket':
          return [
            'በየቀኑ በፍጥነት የሚያልቁ የውሃና የዳቦ ምርቶችን መርምር',
            'በአነስተኛ ቦታ ከፍተኛ ገቢ የሚያመጡ ምርቶችን እንዴት እናቀናጅ?',
            'ለዛሬ ማታ የመጋዘን መሙያ አነስተኛ PO ረቂቅ አዘጋጅ',
            'የTelebirr እና የዕለታዊ ዱቤ መቆጣጠሪያ ምክር ስጥ',
          ];
        case 'shop':
          return [
            'የቆዳ ጫማና የልብስ መጠኖችን (S–XXL) ክፍተት መርምር',
            'ቀርፋፋ የሆኑ ዕቃዎችን በ25% ቅናሽ ብንሸጥ ምን ያህል ETB ካሽ ይመለሳል?',
            'ለደንበኛ የሚላክ የዕቃ ዋጋ ዝርዝር (Proforma) አዘጋጅ',
            'ለፈጣን የችርቻሮ ሽያጭ የመልሶ ማዘዣ ነጥብ አስላ',
          ];
        case 'store':
          return [
            'የመጋዘን ፓሌት አጠቃቀምና የሞጆ ደረቅ ወደብ የማድረሻ ጊዜ አስላ',
            'ለጅምላ ክምችት አነስተኛ የትዕዛዝ መጠን (MOQ) እና የቅናሽ እርከን አዘጋጅ',
            'ከአከፋፋዮች ጋር የጅምላ ዋጋ ድርድር ደብዳቤ ጻፍ',
            'የFIFO እና የFEFO የመጋዘን ማውጫ ፕሮቶኮልን አብራራ',
          ];
        default:
          return [
            'አነስተኛ ክምችት ያላቸውን እቃዎች መርምርና የETB የግዢ በጀት ስጥ',
            'የቅርንጫፎች ስርጭትንና የማጓጓዣ ወጪን በETB መርምር',
            'የክምችት ማቆያ ወጪን በ15% ለመቀነስ ምን እርምጃ መውሰድ አለብን?',
            'ለአቅራቢ የግዢ ማዘዣ ረቂቅ አዘጋጅ እና የዋጋ ድርድር ምክር ስጥ',
          ];
      }
    }

    if (language === 'om') {
      switch (businessType) {
        case 'pharmacy':
          return [
            'Qorichoota yeroon isaanii dhumachuuf jedhu qoriitii baajata ETB shallagi',
            'Qajeelfama eegumsa qorichoota qorraa (insulin 2–8°C) naaf ibsi',
            'Qabxii ajaja haaraa (ROP) qorichoota ariitiin gurguramanii shallagi',
            'Qisaasa\'ina qorichaa fi dogoggora EFDA akkamitti hir\'isna?',
          ];
        case 'building':
          return [
            'Gatii sibiila rebar 12mm fi simintoo kuusaa ETB dhaan shallagi',
            'Tooftaa eegumsa simintoo fi itti fayyadama FIFO qopheessi',
            'Fe\'umsa Isuzu FSR (11T) simintoo fi bulookeetii naaf madaali',
            'Kontoiraaktarootaaf liqii daldalaa fi ajaja bittaa (PO) qopheessi',
          ];
        case 'supermarket':
        case 'minimarket':
          return [
            'Meeshaalee nyaataa fi aannanii saffisaan gurguraman qori',
            'Bu\'aa gurgurtaa zayitaa fi ruuzii ETB dhaan akkamitti daballa?',
            'Ajaja bittaa ariifachiisaa dhiyeessitootaaf wixinee qopheessi',
            'Qisaasa\'ina meeshaalee yeroo gabaabaa akkamitti to\'anna?',
          ];
        case 'store':
          return [
            'Itti fayyadama iddoo paaleetii fi yeroo geejjibaa Modjoo shallagi',
            'Safara ajaja xiqqaa (MOQ) fi hir\'ina gatii jumlaa qopheessi',
            'Dhiyeessitootaaf xalayaa marii gatii jumlaa barreessi',
            'Sirna baasii kuusaa FIFO fi FEFO naaf ibsi',
          ];
        default:
          return [
            'Meeshaalee kuusaa keessatti xiqqaatan qoriitii gorsa bittaa kenni',
            'Gatii seensaa fi gurgurtaa gidduu bu\'aa ETB jiru akkamitti daballa?',
            'Dhiyeessitoota keenyaaf wixinee ajaja bittaa qopheessi',
            'Baasii qabeenya kuusaa eeguu 15% akkamitti hir\'isna?',
          ];
      }
    }

    if (language === 'ti') {
      switch (businessType) {
        case 'pharmacy':
          return [
            'ክውድኡ ዝቐረቡ መድሓኒታት መርሚርካ ናይ ETB ዕድጊት ሓሳብ ሃበኒ',
            'ናይ ኢንሱሊንን ዝሑል መድሓኒታትን (2–8°C) ኣተሓሕዛ ግለጸለይ',
            'ንዝቐልጥፉ መድሓኒታት ደገፍ ዳግመ-ዕድጊት (ROP) ሕሰበለይ',
            'ብኽነት መድሓኒትን ጌጋ EFDAን ብኸመይ ንቕንሶ?',
          ];
        case 'building':
          return [
            'ናይ 12ሚሜ ፌሮ ሓጺንን ሲሚንቶን ዋጋ ብETB ሕሰበለይ',
            'ምክልኻል ጠሊ ሲሚንቶን ስርዓት FIFOን መደብ ኣዳሉ',
            'ጽዕነት ኣይሱዙ (11 ቶን) ሲሚንቶን ብሎኬትን መርምረለይ',
            'ንኮንትራክተራት ናይ ዕድጊት ትእዛዝ (PO) ኣዳሉ',
          ];
        case 'supermarket':
        case 'minimarket':
          return [
            'ምህርቲ ጸባን ሕብስትን ንኸይበላሾ ዝሕግዝ ምኽሪ ሃበኒ',
            'ዋጋ ዘይቲ ምግብን ሩዝን ብETB ከመይ ንመሓይሾ?',
            'ናይ ዕድጊት ትእዛዝ (PO) ንኣቕረብቲ ኣዳሉ',
            'ናይ መደርደሪ ምድላውን ቀልጢፉ ዝሽየጥ ኣቑሑትን ግለጸለይ',
          ];
        case 'store':
          return [
            'ኣጠቓቕማ ቦታ ፓሌትን ግዜ መጎዓዝያ ሞጆን ሕሰብ',
            'ዝተሓተ መጠን ትእዛዝ (MOQ) ንኣቕረብቲ ኣዳሉ',
            'ደብዳቤ ምምሕያሽ ዋጋ ጅምላ ንኣቕረብቲ ጸሓፍ',
            'ስርዓት ምውጻእ መኽዘን FIFOን FEFOን ግለጽ',
          ];
        default:
          return [
            'ሊውድኡ ዝቐረቡ ኣቑሑት መርሚርካ ናይ ETB ምዕዳግ ሓሳብ ሃበኒ',
            'ናይ ዕድጊት ትእዛዝ (PO) ንኣቕረብቲ ኣዳሉ',
            'መኽዘን ኣቑሑት ንምምሕዳር ዘኽእል ጽቡቕ ሜላታት ግለጸለይ',
            'ዋጋታት መሸጣን መኽሰብን ብኸመይ ንውስኽ?',
          ];
      }
    }

    if (language === 'so') {
      switch (businessType) {
        case 'pharmacy':
          return [
            'Baar dawooyinka dhicitaanka ku dhow oo xisaabi miisaaniyadda ETB',
            'Sharax nidaamka qaboojinta insulin-ta iyo tallaalka (2–8°C)',
            'Xisaabi heerka dib-u-dalabka (ROP) dawooyinka dhaqsaha u baxa',
            'Sideen u yarayn karnaa khasaaraha dawooyinka dhaca?',
          ];
        case 'building':
          return [
            'Xisaabi qiimaha birta rebar 12mm iyo shamiitada ee ku jira ETB',
            'Deji qorshe FIFO ah si shamiitada qoyaanka looga ilaaliyo',
            'Hubi culeyska baabuurka Isuzu FSR (11T) ee shamiitada iyo bulukeetiga',
            'U qor dalabka soo iibinta (PO) alaabta dhismaha',
          ];
        case 'supermarket':
        case 'minimarket':
          return [
            'Falanqee caanaha, rootiga iyo khudaarta si looga hortago qasaaraha',
            'Sideen u kordhin karnaa faa’iidada saliidda iyo bariiska ee ETB?',
            'Qor dalab soo iibin ah oo loo dirayo ganacsatada jumlada',
            'Talo ka bixi diyaarinta shelf-yada dhamaadka todobaadka',
          ];
        case 'store':
          return [
            'Xisaabi isticmaalka booska pallet-ka iyo waqtiga keenista dekadda Modjo',
            'Deji heerka ugu yar ee dalabka (MOQ) iyo qiimo dhimista jumlada',
            'Qor warqad gorgortan qiimo oo loo dirayo alaab-qeybiyeyaasha',
            'Sharax faraqa u dhexeeya FIFO iyo FEFO ee bakhaarka weyn',
          ];
        default:
          return [
            'Baar alaabta ku dhow dhamaadka oo bixi talo dib u soo iibin ETB ah',
            'Qor qoraal dalab soo iibin ah oo loo dirayo ganacsadaha',
            'Sideen kharashka haynta kaydka u dhimi karnaa 15%?',
            'Sharax habka ugu fiican ee maareynta alaabta iyo qiimaynta',
          ];
      }
    }

    switch (businessType) {
      case 'pharmacy':
        return [
          'Audit batches expiring within 90 days & calculate ETB replacement cost',
          'Review WHO 2°C–8°C cold-chain protocol for our insulin vials',
          'Calculate reorder point (ROP) for fast-moving antibiotics & analgesics',
          'Give EFDA compliance steps to cut pharmaceutical shrinkage',
        ];
      case 'building':
        return [
          'Audit cement & steel rebar stock levels and estimate ETB restock budget',
          'Plan 50kg cement FIFO rotation before 60-day hydration curing risk',
          'Verify Isuzu FSR (11T) load mix for cement bags + HCB blocks',
          'Draft a wholesale factory PO for rebar & galvanized roofing sheets',
        ];
      case 'supermarket':
        return [
          'Identify fresh dairy & bakery spoilage risk & optimal ETB markdowns',
          'Plan high-turnover weekend aisle restock schedule',
          'Compare gross ETB margins across cooking oil, rice, and coffee SKUs',
          'Draft supplier PO for fast-moving FMCG replenishment',
        ];
      case 'minimarket':
        return [
          'Prioritize morning crate restocks for water, bread, dairy, and soft drinks',
          'Calculate cash margin recovery & Telebirr turnover on our fast movers',
          'Draft a compact 48-hour express restock PO in ETB',
          'Identify slow items tying up counter shelf space',
        ];
      case 'shop':
        return [
          'Audit apparel & footwear size-run gaps (S–XXL / EU 39–45)',
          'Calculate ETB cash unlocked from a 25% seasonal clearance markdown',
          'Draft a customer proforma invoice for wholesale boutique buyers',
          'Identify highest-margin SKUs to reorder before peak season',
        ];
      case 'store':
        return [
          'Audit pallet bay capacity & inbound container lead times',
          'Formulate MOQ & volume rebate tiers in ETB for B2B buyers',
          'Draft a freight & supplier price renegotiation memo',
          'Optimize FIFO/FEFO picking across our wholesale depots',
        ];
      default:
        return [
          'Audit low stock SKUs and give ETB replenishment budget',
          'Evaluate branch stock distribution & transfer priorities',
          'How can we cut inventory holding cost by 15% in ETB?',
          'Draft a supplier PO and landed-cost negotiation checklist',
        ];
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 h-[100dvh] w-full sm:w-[500px] md:w-[540px] max-w-full terit-modal rounded-none sm:rounded-l-3xl border-y-0 border-r-0 flex flex-col text-slate-900 dark:text-slate-100 transition-colors">
      {/* Top Header */}
      <div className="p-4 border-b border-slate-200 dark:border-white/10 flex items-center justify-between gap-2 bg-white/90 dark:bg-slate-950/60 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <BotMessageSquare className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-sm flex flex-wrap items-center gap-1.5">
              <span>{t('copilot_btn')}</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30 whitespace-nowrap">
                {activeNicheLabel}
              </span>
            </h3>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 truncate">
              {t('copilot_header_subtitle')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={clearChat}
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title={t('copilot_reset_title')}
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title={t('copilot_close_title')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Mode Selector Bar */}
      <div className="px-4 py-2 bg-slate-100/90 dark:bg-slate-950/40 border-b border-slate-200 dark:border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs shrink-0">
        <span className="text-[11px] text-slate-600 dark:text-slate-400 font-semibold">{t('copilot_model_engine')}:</span>
        <div className="flex items-center gap-1 p-0.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg shadow-2xs">
          <button
            onClick={() => setModelMode('fast')}
            className={`px-2 py-1 rounded text-[11px] font-medium flex items-center gap-1 transition-colors cursor-pointer ${
              modelMode === 'fast'
                ? 'bg-amber-500/15 text-amber-800 dark:text-amber-400 font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
            title={t('copilot_fast_tooltip')}
          >
            <Zap className="w-3 h-3 text-amber-500" />
            <span>{t('copilot_mode_fast')}</span>
          </button>

          <button
            onClick={() => setModelMode('general')}
            className={`px-2 py-1 rounded text-[11px] font-medium flex items-center gap-1 transition-colors cursor-pointer ${
              modelMode === 'general'
                ? 'bg-amber-500/15 text-amber-800 dark:text-amber-400 font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
            title={t('copilot_general_tooltip')}
          >
            <Sparkles className="w-3 h-3 text-amber-500" />
            <span>{t('copilot_mode_general')}</span>
          </button>

          <button
            onClick={() => setModelMode('complex')}
            className={`px-2 py-1 rounded text-[11px] font-medium flex items-center gap-1 transition-colors cursor-pointer ${
              modelMode === 'complex'
                ? 'bg-amber-500/15 text-amber-800 dark:text-amber-400 font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
            title={t('copilot_complex_tooltip')}
          >
            <Brain className="w-3 h-3 text-amber-500" />
            <span>{t('copilot_mode_complex')}</span>
          </button>
        </div>
      </div>

      {/* Scrollable Message Thread */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex items-start gap-2.5 ${isUser ? 'flex-row-reverse' : ''}`}
            >
              {/* Avatar */}
              <div
                className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                  isUser
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 border border-slate-200 dark:border-slate-700 shadow-2xs'
                }`}
              >
                {isUser ? <User className="w-3.5 h-3.5" /> : <BotMessageSquare className="w-3.5 h-3.5" />}
              </div>

              {/* Message Bubble */}
              <div
                className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                  isUser
                    ? 'bg-amber-500 text-slate-950 font-semibold rounded-tr-none shadow-xs'
                    : 'bg-white dark:bg-slate-800/80 text-slate-900 dark:text-slate-200 border border-slate-200 dark:border-slate-700/80 rounded-tl-none space-y-2 shadow-2xs'
                }`}
              >
                <div>{renderFormattedContent(msg.content, isUser)}</div>

                <div
                  className={`flex items-center justify-between text-[10px] mt-1 pt-1 ${
                    isUser
                      ? 'text-slate-800 border-t border-amber-600/30'
                      : 'text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-700/50'
                  }`}
                >
                  <span className="font-mono">{msg.timestamp}</span>
                  {!isUser && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCopy(msg.content, msg.id)}
                        className="hover:text-slate-900 dark:hover:text-white cursor-pointer"
                        title={t('copilot_copy_title')}
                      >
                        {copiedId === msg.id ? (
                          <Check className="w-3 h-3 text-emerald-500" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex items-center gap-2.5 text-xs text-slate-600 dark:text-slate-400 py-2">
            <div className="w-7 h-7 rounded-xl bg-white dark:bg-slate-800 text-amber-500 border border-slate-200 dark:border-slate-700 flex items-center justify-center">
              <BotMessageSquare className="w-3.5 h-3.5" />
            </div>
            <div className="flex items-center gap-2 p-3 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
              <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
              <span>{t('copilot_analyzing')}</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompts */}
      <div className="px-4 py-2.5 border-t border-slate-200 dark:border-slate-800/80 bg-slate-50/90 dark:bg-slate-950/40 shrink-0">
        <div className="text-[10px] uppercase font-bold tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
          {activeNicheLabel} · {t('copilot_quick_prompts')}:
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {getBusinessPrompts().map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(prompt)}
              className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-300 hover:text-amber-800 dark:hover:text-white border border-slate-300 dark:border-slate-700 text-[11px] whitespace-nowrap transition-colors shadow-2xs cursor-pointer"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Input Form */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('copilot_input_placeholder')}
            className="flex-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="p-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold transition-colors cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
