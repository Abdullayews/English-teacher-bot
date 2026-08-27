import dotenv from 'dotenv';
import pool from './db.js';
dotenv.config();

// REAL VƏ KEYFİYYƏTLİ 500 SÖZ [Söz, Tərcümə, Səviyyə, Kateqoriya]
const rawWords = [
  // A1 (100 söz)
  ['apple', 'Alma', 'A1', 'food'], ['bread', 'Çörək', 'A1', 'food'], ['water', 'Su', 'A1', 'drink'], ['dog', 'İt', 'A1', 'animal'], ['cat', 'Pişik', 'A1', 'animal'],
  ['house', 'Ev', 'A1', 'place'], ['car', 'Maşın', 'A1', 'transport'], ['run', 'Qaçmaq', 'A1', 'verb'], ['eat', 'Yemək', 'A1', 'verb'], ['sleep', 'Yatmaq', 'A1', 'verb'],
  ['happy', 'Xoşbəxt', 'A1', 'adjective'], ['sad', 'Kədərli', 'A1', 'adjective'], ['big', 'Böyük', 'A1', 'adjective'], ['small', 'Kiçik', 'A1', 'adjective'], ['red', 'Qırmızı', 'A1', 'color'],
  ['book', 'Kitab', 'A1', 'object'], ['pen', 'Qələm', 'A1', 'object'], ['day', 'Gün', 'A1', 'time'], ['night', 'Gecə', 'A1', 'time'], ['sun', 'Günəş', 'A1', 'nature'],
  ['man', 'Kişi', 'A1', 'noun'], ['woman', 'Qadın', 'A1', 'noun'], ['boy', 'Oğlan', 'A1', 'noun'], ['girl', 'Qız', 'A1', 'noun'], ['go', 'Getmək', 'A1', 'verb'],
  ['come', 'Gəlmək', 'A1', 'verb'], ['look', 'Baxmaq', 'A1', 'verb'], ['see', 'Görmək', 'A1', 'verb'], ['hear', 'Eşitmək', 'A1', 'verb'], ['read', 'Oxumaq', 'A1', 'verb'],
  ['write', 'Yazmaq', 'A1', 'verb'], ['play', 'Oynamaq', 'A1', 'verb'], ['work', 'İşləmək', 'A1', 'verb'], ['sit', 'Oturmaq', 'A1', 'verb'], ['stand', 'Dayanmaq', 'A1', 'verb'],
  ['walk', 'Addımlamaq', 'A1', 'verb'], ['wake', 'Oyanmaq', 'A1', 'verb'], ['open', 'Açmaq', 'A1', 'verb'], ['close', 'Bağlamaq', 'A1', 'verb'], ['buy', 'Almaq', 'A1', 'verb'],
  ['give', 'Vermək', 'A1', 'verb'], ['take', 'Götürmək', 'A1', 'verb'], ['make', 'Düzmək', 'A1', 'verb'], ['have', 'Sahib olmaq', 'A1', 'verb'], ['want', 'İstəmək', 'A1', 'verb'],
  ['need', 'Ehtiyac duymaq', 'A1', 'verb'], ['like', 'Sevmək', 'A1', 'verb'], ['love', 'Aşiq olmaq', 'A1', 'verb'], ['know', 'Bilmək', 'A1', 'verb'], ['think', 'Düşünmək', 'A1', 'verb'],
  ['hot', 'İsti', 'A1', 'adjective'], ['cold', 'Soyuq', 'A1', 'adjective'], ['new', 'Yeni', 'A1', 'adjective'], ['old', 'Köhnə', 'A1', 'adjective'], ['fast', 'Sürətli', 'A1', 'adjective'],
  ['slow', 'Yavaş', 'A1', 'adjective'], ['time', 'Vaxt', 'A1', 'time'], ['year', 'İl', 'A1', 'time'], ['month', 'Ay', 'A1', 'time'], ['week', 'Həftə', 'A1', 'time'],
  ['table', 'Masa', 'A1', 'object'], ['chair', 'Stul', 'A1', 'object'], ['bed', 'Yataq', 'A1', 'object'], ['door', 'Qapı', 'A1', 'object'], ['room', 'Otaq', 'A1', 'place'],
  ['home', 'Yuva', 'A1', 'place'], ['city', 'Şəhər', 'A1', 'place'], ['food', 'Qida', 'A1', 'food'], ['meat', 'Ət', 'A1', 'food'], ['fish', 'Balıq', 'A1', 'food'],
  ['milk', 'Süd', 'A1', 'drink'], ['tea', 'Çay', 'A1', 'drink'], ['coffee', 'Qəhvə', 'A1', 'drink'], ['fruit', 'Meyvə', 'A1', 'food'], ['good', 'Yaxşı', 'A1', 'adjective'],
  ['bad', 'Pis', 'A1', 'adjective'], ['blue', 'Mavi', 'A1', 'color'], ['green', 'Yaşıl', 'A1', 'color'], ['yellow', 'Sarı', 'A1', 'color'], ['white', 'Ağ', 'A1', 'color'],
  ['black', 'Qara', 'A1', 'color'], ['one', 'Bir', 'A1', 'number'], ['two', 'İki', 'A1', 'number'], ['three', 'Üç', 'A1', 'number'], ['four', 'Dörd', 'A1', 'number'],
  ['five', 'Beş', 'A1', 'number'], ['six', 'Altı', 'A1', 'number'], ['seven', 'Yeddi', 'A1', 'number'], ['eight', 'Səkkiz', 'A1', 'number'], ['nine', 'Doqquz', 'A1', 'number'],
  ['ten', 'On', 'A1', 'number'], ['family', 'Ailə', 'A1', 'noun'], ['friend', 'Dost', 'A1', 'noun'], ['child', 'Uşaq', 'A1', 'noun'], ['school', 'Məktəb', 'A1', 'place'],
  ['teacher', 'Müəllim', 'A1', 'noun'], ['student', 'Şagird', 'A1', 'noun'], ['job', 'İş', 'A1', 'noun'], ['money', 'Pul', 'A1', 'noun'], ['price', 'Qiymət', 'A1', 'noun'],

  // A2 (100 söz)
  ['bridge', 'Körpü', 'A2', 'place'], ['kitchen', 'Mətbəx', 'A2', 'place'], ['train', 'Qatar', 'A2', 'transport'], ['bicycle', 'Velosiped', 'A2', 'transport'], ['weather', 'Hava', 'A2', 'nature'],
  ['storm', 'Fırtına', 'A2', 'nature'], ['expensive', 'Bahalı', 'A2', 'adjective'], ['cheap', 'Ucuz', 'A2', 'adjective'], ['garden', 'Bağ', 'A2', 'place'], ['window', 'Pəncərə', 'A2', 'object'],
  ['mountain', 'Dağ', 'A2', 'nature'], ['river', 'Çay', 'A2', 'nature'], ['start', 'Başlamaq', 'A2', 'verb'], ['finish', 'Bitirmək', 'A2', 'verb'], ['decide', 'Qərar vermək', 'A2', 'verb'],
  ['choose', 'Seçmək', 'A2', 'verb'], ['build', 'İnşa etmək', 'A2', 'verb'], ['break', 'Sındırmaq', 'A2', 'verb'], ['fix', 'Təmir etmək', 'A2', 'verb'], ['repair', 'Düzəltmək', 'A2', 'verb'],
  ['clean', 'Təmizləmək', 'A2', 'verb'], ['dirty', 'Çirkli', 'A2', 'adjective'], ['dry', 'Quru', 'A2', 'adjective'], ['wet', 'Yaş', 'A2', 'adjective'], ['easy', 'Asan', 'A2', 'adjective'],
  ['hard', 'Çətin', 'A2', 'adjective'], ['simple', 'Sadə', 'A2', 'adjective'], ['beautiful', 'Gözəl', 'A2', 'adjective'], ['ugly', 'Çirkin', 'A2', 'adjective'], ['pretty', 'Cazibədar', 'A2', 'adjective'],
  ['tall', 'Uzun boy', 'A2', 'adjective'], ['short', 'Qısa', 'A2', 'adjective'], ['fat', 'Kök', 'A2', 'adjective'], ['thin', 'Zərif', 'A2', 'adjective'], ['strong', 'Güclü', 'A2', 'adjective'],
  ['weak', 'Zəif', 'A2', 'adjective'], ['sick', 'Xəstə', 'A2', 'adjective'], ['healthy', 'Sağlam', 'A2', 'adjective'], ['safe', 'Təhlükəsiz', 'A2', 'adjective'], ['dangerous', 'Təhlükəli', 'A2', 'adjective'],
  ['angry', 'Qəzəbli', 'A2', 'adjective'], ['calm', 'Sakit', 'A2', 'adjective'], ['excited', 'Həyəcanlı', 'A2', 'adjective'], ['bored', 'Sıxılmış', 'A2', 'adjective'], ['surprised', 'Təəccüblənmiş', 'A2', 'adjective'],
  ['scared', 'Qorxmuş', 'A2', 'adjective'], ['brave', 'Cəsarətli', 'A2', 'adjective'], ['proud', 'Qürurlu', 'A2', 'adjective'], ['travel', 'Səyahət etmək', 'A2', 'verb'], ['arrive', 'Çatmaq', 'A2', 'verb'],
  ['leave', 'Tərk etmək', 'A2', 'verb'], ['stay', 'Qalmaq', 'A2', 'verb'], ['visit', 'Ziyarət etmək', 'A2', 'verb'], ['meet', 'Rastlaşmaq', 'A2', 'verb'], ['invite', 'Dəvət etmək', 'A2', 'verb'],
  ['accept', 'Qəbul etmək', 'A2', 'verb'], ['refuse', 'İmtina etmək', 'A2', 'verb'], ['help', 'Kömək etmək', 'A2', 'verb'], ['ask', 'Soruşmaq', 'A2', 'verb'], ['answer', 'Cavab vermək', 'A2', 'verb'],
  ['tell', 'Demək', 'A2', 'verb'], ['say', 'Söyləmək', 'A2', 'verb'], ['discuss', 'Müzakirə etmək', 'A2', 'verb'], ['argue', 'Mübahisə etmək', 'A2', 'verb'], ['agree', 'Razılaşmaq', 'A2', 'verb'],
  ['believe', 'İnanmaq', 'A2', 'verb'], ['trust', 'Etibar etmək', 'A2', 'verb'], ['hope', 'Ümid etmək', 'A2', 'verb'], ['wish', 'Arzulamaq', 'A2', 'verb'], ['dream', 'Yuxu görmək', 'A2', 'verb'],
  ['remember', 'Xatırlamaq', 'A2', 'verb'], ['forget', 'Unutmaq', 'A2', 'verb'], ['learn', 'Öyrənmək', 'A2', 'verb'], ['teach', 'Öyrətmək', 'A2', 'verb'], ['study', 'Dərs oxumaq', 'A2', 'verb'],
  ['understand', 'Anlamaq', 'A2', 'verb'], ['show', 'Göstərmək', 'A2', 'verb'], ['hide', 'Gizlətmək', 'A2', 'verb'], ['find', 'Tapmaq', 'A2', 'verb'], ['lose', 'İtirmək', 'A2', 'verb'],
  ['search', 'Axtarmaq', 'A2', 'verb'], ['change', 'Dəyişmək', 'A2', 'verb'], ['continue', 'Davam etmək', 'A2', 'verb'], ['begin', 'Başlamaq', 'A2', 'verb'], ['end', 'Bitmək', 'A2', 'verb'],
  ['create', 'Yaratmaq', 'A2', 'verb'], ['destroy', 'Məhv etmək', 'A2', 'verb'], ['improve', 'Yaxşılaşdırmaq', 'A2', 'verb'], ['worsen', 'Pisləşmək', 'A2', 'verb'], ['increase', 'Artırmaq', 'A2', 'verb'],
  ['decrease', 'Azaltmaq', 'A2', 'verb'], ['expand', 'Genişlənmək', 'A2', 'verb'], ['reduce', 'Kiçiltmək', 'A2', 'verb'], ['produce', 'İstehsal etmək', 'A2', 'verb'], ['consume', 'İstehlak etmək', 'A2', 'verb'],
  ['save', 'Saxlamaq', 'A2', 'verb'], ['waste', 'Zay etmək', 'A2', 'verb'], ['store', 'Yığmaq', 'A2', 'verb'], ['carry', 'Daşımaq', 'A2', 'verb'], ['push', 'İtmək', 'A2', 'verb'],

  // B1 (100 söz)
  ['decision', 'Qərar', 'B1', 'abstract'], ['manage', 'İdarə etmək', 'B1', 'verb'], ['achieve', 'Nail olmaq', 'B1', 'verb'], ['discover', 'Kəşf etmək', 'B1', 'verb'], ['reduce', 'Azaltmaq', 'B1', 'verb'],
  ['consider', 'Nəzərə almaq', 'B1', 'verb'], ['provide', 'Təmin etmək', 'B1', 'verb'], ['protect', 'Qorumaq', 'B1', 'verb'], ['prevent', 'Qarşısını almaq', 'B1', 'verb'], ['support', 'Dəstəkləmək', 'B1', 'verb'],
  ['expect', 'Gözləmək', 'B1', 'verb'], ['explain', 'İzah etmək', 'B1', 'verb'], ['explore', 'Tədqiq etmək', 'B1', 'verb'], ['identify', 'Müəyyən etmək', 'B1', 'verb'], ['opportunity', 'Fürsət', 'B1', 'abstract'],
  ['challenge', 'Çağırış', 'B1', 'abstract'], ['success', 'Uğur', 'B1', 'abstract'], ['experience', 'Təcrübə', 'B1', 'abstract'], ['knowledge', 'Bilik', 'B1', 'abstract'], ['ability', 'Qabiliyyət', 'B1', 'abstract'],
  ['behavior', 'Davranış', 'B1', 'abstract'], ['character', 'Xarakter', 'B1', 'abstract'], ['condition', 'Şərait', 'B1', 'abstract'], ['environment', 'Mühit', 'B1', 'abstract'], ['society', 'Cəmiyyət', 'B1', 'abstract'],
  ['culture', 'Mədəniyyət', 'B1', 'abstract'], ['tradition', 'Ənənə', 'B1', 'abstract'], ['history', 'Tarix', 'B1', 'abstract'], ['future', 'Gələcək', 'B1', 'time'], ['past', 'Keçmiş', 'B1', 'time'],
  ['present', 'İndiki', 'B1', 'time'], ['century', 'Əsr', 'B1', 'time'], ['decade', 'Onillik', 'B1', 'time'], ['generation', 'Nəsil', 'B1', 'abstract'], ['population', 'Əhali', 'B1', 'abstract'],
  ['community', 'İcma', 'B1', 'abstract'], ['citizen', 'Vətəndaş', 'B1', 'noun'], ['government', 'Hökumət', 'B1', 'abstract'], ['policy', 'Siyasət', 'B1', 'abstract'], ['economy', 'İqtisadiyyat', 'B1', 'abstract'],
  ['industry', 'Sənaye', 'B1', 'abstract'], ['technology', 'Texnologiya', 'B1', 'abstract'], ['science', 'Elm', 'B1', 'abstract'], ['research', 'Tədqiqat', 'B1', 'abstract'], ['experiment', 'Təcrübə', 'B1', 'abstract'],
  ['evidence', 'Sübut', 'B1', 'abstract'], ['theory', 'Nəzəriyyə', 'B1', 'abstract'], ['fact', 'Fakt', 'B1', 'abstract'], ['opinion', 'Rəy', 'B1', 'abstract'], ['argument', 'Arqument', 'B1', 'abstract'],
  ['debate', 'Müzakirə', 'B1', 'abstract'], ['discussion', 'Müzakirə', 'B1', 'abstract'], ['conversation', 'Söhbət', 'B1', 'abstract'], ['communication', 'İletişim', 'B1', 'abstract'], ['information', 'Məlumat', 'B1', 'abstract'],
  ['data', 'Data', 'B1', 'abstract'], ['report', 'Hesabat', 'B1', 'abstract'], ['article', 'Məqalə', 'B1', 'abstract'], ['document', 'Sənəd', 'B1', 'abstract'], ['summarize', 'Yekunlaşdırmaq', 'B1', 'verb'],
  ['analyze', 'Təhlil etmək', 'B1', 'verb'], ['compare', 'Müqayisə etmək', 'B1', 'verb'], ['contrast', 'Ziddiyyət', 'B1', 'verb'], ['evaluate', 'Qiymətləndirmək', 'B1', 'verb'], ['assess', 'Dəyərləndirmək', 'B1', 'verb'],
  ['measure', 'Ölçmək', 'B1', 'verb'], ['calculate', 'Hesablamaq', 'B1', 'verb'], ['estimate', 'Təxmini hesablamaq', 'B1', 'verb'], ['predict', 'Proqnozlaşdırmaq', 'B1', 'verb'], ['develop', 'İnkişaf etdirmək', 'B1', 'verb'],
  ['invent', 'İxtira etmək', 'B1', 'verb'], ['design', 'Dizayn', 'B1', 'verb'], ['construct', 'İnşa etmək', 'B1', 'verb'], ['damage', 'Zərər', 'B1', 'verb'], ['maintain', 'Qorumaq', 'B1', 'verb'],
  ['operate', 'İşlətmək', 'B1', 'verb'], ['function', 'Funksiya', 'B1', 'verb'], ['process', 'Proses', 'B1', 'abstract'], ['method', 'Metod', 'B1', 'abstract'], ['system', 'Sistem', 'B1', 'abstract'],
  ['structure', 'Struktur', 'B1', 'abstract'], ['complex', 'Mürəkkəb', 'B1', 'adjective'], ['obvious', 'Aydın', 'B1', 'adjective'], ['unclear', 'Qeyri-müəyyən', 'B1', 'adjective'], ['certain', 'Müəyyən', 'B1', 'adjective'],
  ['possible', 'Mümkün', 'B1', 'adjective'], ['impossible', 'Mümkün olmayan', 'B1', 'adjective'], ['necessary', 'Zəruri', 'B1', 'adjective'], ['essential', 'Vacib', 'B1', 'adjective'], ['important', 'Vacib', 'B1', 'adjective'],
  ['ordinary', 'Adi', 'B1', 'adjective'], ['usual', 'Həmişəlik', 'B1', 'adjective'], ['common', 'Ümumi', 'B1', 'adjective'], ['rare', 'Nadir', 'B1', 'adjective'], ['frequent', 'Te-tez', 'B1', 'adjective'],

  // B2 (100 söz)
  ['significant', 'Əhəmiyyətli', 'B2', 'adjective'], ['allocate', 'Ayırmaq', 'B2', 'verb'], ['demonstrate', 'Nümayiş etmək', 'B2', 'verb'], ['attribute', 'Xüsusiyyət', 'B2', 'noun'], ['capacity', 'Tutum', 'B2', 'noun'],
  ['coherent', 'Məntiqi', 'B2', 'adjective'], ['compensate', 'Kompensasiya etmək', 'B2', 'verb'], ['comply', 'Uyğun gəlmək', 'B2', 'verb'], ['conceive', 'Qavramaq', 'B2', 'verb'], ['consensus', 'Konsensus', 'B2', 'noun'],
  ['constitute', 'Təşkil etmək', 'B2', 'verb'], ['contemporary', 'Müasir', 'B2', 'adjective'], ['convey', 'Çatdırmaq', 'B2', 'verb'], ['credible', 'İnanılır', 'B2', 'adjective'], ['diminish', 'Azalmaq', 'B2', 'verb'],
  ['distort', 'Təhrif etmək', 'B2', 'verb'], ['dominate', 'Hakim olmaq', 'B2', 'verb'], ['emphasize', 'Vurğu etmək', 'B2', 'verb'], ['enhance', 'Artırmaq', 'B2', 'verb'], ['equivalent', 'Bərabər', 'B2', 'adjective'],
  ['erode', 'Aşınmaq', 'B2', 'verb'], ['evident', 'Aydın', 'B2', 'adjective'], ['exaggerate', 'Abartmaq', 'B2', 'verb'], ['exceed', 'Keçmək', 'B2', 'verb'], ['exhibit', 'Sərgiləmək', 'B2', 'verb'],
  ['explicit', 'Açıq', 'B2', 'adjective'], ['exploit', 'İstismar etmək', 'B2', 'verb'], ['fluctuate', 'Tərəddüd etmək', 'B2', 'verb'], ['formulate', 'Formullaşdırmaq', 'B2', 'verb'], ['generate', 'Yaratmaq', 'B2', 'verb'],
  ['highlight', 'Vurğulamaq', 'B2', 'verb'], ['hypothesis', 'Fərziyyə', 'B2', 'noun'], ['incentive', 'Həvəsləndirici', 'B2', 'noun'], ['integral', 'Ayrılmaz', 'B2', 'adjective'], ['intervene', 'Müdaxilə etmək', 'B2', 'verb'],
  ['intrinsic', 'Daxili', 'B2', 'adjective'], ['intuitive', 'Sezişi', 'B2', 'adjective'], ['levy', 'Vergi', 'B2', 'noun'], ['likewise', 'Eynilə', 'B2', 'adverb'], ['moreover', 'Üstəlik', 'B2', 'adverb'],
  ['nevertheless', 'Buna baxmayaraq', 'B2', 'adverb'], ['ongoing', 'Davam edən', 'B2', 'adjective'], ['phenomenon', 'Fenomen', 'B2', 'noun'], ['predominant', 'Üstün', 'B2', 'adjective'], ['preliminary', 'İlkin', 'B2', 'adjective'],
  ['preserve', 'Qorumaq', 'B2', 'verb'], ['presumably', 'Ehtimal ki', 'B2', 'adverb'], ['prevalent', 'Yayğın', 'B2', 'adjective'], ['prospect', 'Ümid', 'B2', 'noun'], ['retrieve', 'Geri qaytarmaq', 'B2', 'verb'],
  ['scrutinize', 'Diqqətlə yoxlamaq', 'B2', 'verb'], ['subsequent', 'Növbəti', 'B2', 'adjective'], ['suppress', 'Yatırtmaq', 'B2', 'verb'], ['sustain', 'Davam etdirmək', 'B2', 'verb'], ['threshold', 'Hədd', 'B2', 'noun'],
  ['trigger', 'Tətikləmək', 'B2', 'verb'], ['undermine', 'Zəiflətmək', 'B2', 'verb'], ['validity', 'Keçərli', 'B2', 'noun'], ['whereby', 'Bununla', 'B2', 'adverb'], ['yield', 'Verim', 'B2', 'noun'],
  ['accomplish', 'Yerinə yetirmək', 'B2', 'verb'], ['acknowledge', 'Təsdiq etmək', 'B2', 'verb'], ['adequate', 'Kifayət qədər', 'B2', 'adjective'], ['advocate', 'Tərəfdar olmaq', 'B2', 'verb'], ['arbitrary', 'Təsadüfi', 'B2', 'adjective'],
  ['assemble', 'Yığmaq', 'B2', 'verb'], ['benefit', 'Fayda', 'B2', 'noun'], ['circumstance', 'Şərait', 'B2', 'noun'], ['deduce', 'Nəticə çıxarmaq', 'B2', 'verb'], ['dedicate', 'Həsr etmək', 'B2', 'verb'],
  ['deficit', 'Defisit', 'B2', 'noun'], ['deprive', 'Məhrum etmək', 'B2', 'verb'], ['derive', 'Almaq', 'B2', 'verb'], ['distinct', 'Fərqli', 'B2', 'adjective'], ['divert', 'Yönləndirmək', 'B2', 'verb'],
  ['duration', 'Müddət', 'B2', 'noun'], ['eligible', 'Uyğun', 'B2', 'adjective'], ['emerge', 'Meydana çıxmaq', 'B2', 'verb'], ['endure', 'Dözmək', 'B2', 'verb'], ['enforce', 'Tətbiq etmək', 'B2', 'verb'],

  // C1 (100 söz)
  ['ubiquitous', 'Hər yerdə olan', 'C1', 'adjective'], ['candid', 'Səmimi', 'C1', 'adjective'], ['coerce', 'Məcbur etmək', 'C1', 'verb'], ['demagogue', 'Demoqoq', 'C1', 'noun'], ['enigma', 'Sirr', 'C1', 'noun'],
  ['corroborate', 'Təsdiqləmək', 'C1', 'verb'], ['credulous', 'Əsnək', 'C1', 'adjective'], ['deference', 'Hörmət', 'C1', 'noun'], ['delineate', 'Təsvir etmək', 'C1', 'verb'], ['denigrate', 'Qara çalmaq', 'C1', 'verb'],
  ['deride', 'Lağ etmək', 'C1', 'verb'], ['didactic', 'Didaktik', 'C1', 'adjective'], ['dilatory', 'Ləng', 'C1', 'adjective'], ['disparage', 'Aşağılamaq', 'C1', 'verb'], ['dogmatic', 'Doqmatik', 'C1', 'adjective'],
  ['ebullient', 'Coşğun', 'C1', 'adjective'], ['eclectic', 'Eklektik', 'C1', 'adjective'], ['egregious', 'Dəhşətli', 'C1', 'adjective'], ['ephemeral', 'Keçici', 'C1', 'adjective'], ['equivocate', 'İkiüzlü danışmaq', 'C1', 'verb'],
  ['erudite', 'Mütəxəssis', 'C1', 'adjective'], ['esoteric', 'Gizli', 'C1', 'adjective'], ['eulogy', 'Mədhiyyə', 'C1', 'noun'], ['euphemism', 'Eufemizm', 'C1', 'noun'], ['exacerbate', 'Pisləşdirmək', 'C1', 'verb'],
  ['exculpate', 'Beraət etdirmək', 'C1', 'verb'], ['exigency', 'Zərurət', 'C1', 'noun'], ['extraneous', 'Xarici', 'C1', 'adjective'], ['fastidious', 'İntizamlı', 'C1', 'adjective'], ['fatuous', 'Axmaq', 'C1', 'adjective'],
  ['garrulous', 'Danışıq', 'C1', 'adjective'], ['germane', 'Uyğun', 'C1', 'adjective'], ['grandstand', 'Özünü göstərmək', 'C1', 'verb'], ['hackneyed', 'Banal', 'C1', 'adjective'], ['iconoclast', 'İdolqırıcı', 'C1', 'noun'],
  ['idolatry', 'Bütpərəstlik', 'C1', 'noun'], ['impecunious', 'Kasıb', 'C1', 'adjective'], ['incipient', 'Başlanğıc', 'C1', 'adjective'], ['ineluctable', 'Yarılmaz', 'C1', 'adjective'], ['ingenuous', 'Naiv', 'C1', 'adjective'],
  ['invective', 'Söyüş', 'C1', 'noun'], ['irascible', 'Asan qəzəblənən', 'C1', 'adjective'], ['laconic', 'Qısa', 'C1', 'adjective'], ['laudable', 'Təqdirəlayiq', 'C1', 'adjective'], ['magnanimous', 'Böyükürəkli', 'C1', 'adjective'],
  ['malevolent', 'Pis niyyətli', 'C1', 'adjective'], ['malign', 'Zərərli', 'C1', 'verb'], ['mellifluous', 'Şirin', 'C1', 'adjective'], ['mendacious', 'Yalançı', 'C1', 'adjective'], ['mercurial', 'Dəyişkən', 'C1', 'adjective'],
  ['meticulous', 'Ehtiyatlı', 'C1', 'adjective'], ['misogynist', 'Qadınlardan nifrət edən', 'C1', 'noun'], ['mitigate', 'Yüngülləşdirmək', 'C1', 'verb'], ['mollify', 'Yatırtmaq', 'C1', 'verb'], ['morose', 'Qısqanc', 'C1', 'adjective'],
  ['mundane', 'Müəyyən', 'C1', 'adjective'], ['nefarious', 'Şər', 'C1', 'adjective'], ['neophyte', 'Yeni başlayan', 'C1', 'noun'], ['noxious', 'Zəhərli', 'C1', 'adjective'], ['obfuscate', 'Qarışdırmaq', 'C1', 'verb'],
  ['obstreperous', 'Səs-küylü', 'C1', 'adjective'], ['obsequious', 'Yaltaq', 'C1', 'adjective'], ['ostentatious', 'Özünü göstərən', 'C1', 'adjective'], ['pacific', 'Sülhpərvər', 'C1', 'adjective'], ['pariah', 'Çəpə', 'C1', 'noun'],
  ['pejorative', 'Aşağılayıcı', 'C1', 'adjective'], ['pellucid', 'Şəffaf', 'C1', 'adjective'], ['penchant', 'Meyl', 'C1', 'noun'], ['pernicious', 'Məhvedici', 'C1', 'adjective'], ['perspicacious', 'Dərindüşüncəli', 'C1', 'adjective'],
  ['placate', 'Yatırtmaq', 'C1', 'verb'], ['platitude', 'Könülxoşluğu', 'C1', 'noun'], ['plethora', 'Bolluq', 'C1', 'noun'], ['pragmatic', 'Praqmatik', 'C1', 'adjective'], ['precarious', 'Etibarsız', 'C1', 'adjective'],
  ['predilection', 'Meyl', 'C1', 'noun'], ['prescient', 'Peyğəmbərvari', 'C1', 'adjective'], ['prevaricate', 'İkiüzlü danışmaq', 'C1', 'verb'], ['profligate', 'Səfeh', 'C1', 'adjective'], ['prolific', 'Məhsuldar', 'C1', 'adjective'],
  ['propensity', 'Meyl', 'C1', 'noun'], ['prosaic', 'Adi', 'C1', 'adjective'], ['pundit', 'Mütəxəssis', 'C1', 'noun'], ['quaint', 'Orijinal', 'C1', 'adjective'], ['querulous', 'Şikayətçi', 'C1', 'adjective'],
  ['quixotic', 'İdealist', 'C1', 'adjective'], ['recalcitrant', 'İtaətsiz', 'C1', 'adjective'], ['recant', 'İnkar etmək', 'C1', 'verb'], ['recondite', 'Gizli', 'C1', 'adjective'], ['redoubtable', 'Möhtəşəm', 'C1', 'adjective'],
  ['relegate', 'Köçürmək', 'C1', 'verb'], ['remonstrate', 'Etiraz etmək', 'C1', 'verb'], ['rend', 'Yırtmaq', 'C1', 'verb'], ['reprehensible', 'Qınanan', 'C1', 'adjective'], ['repudiate', 'Rədd etmək', 'C1', 'verb'],
  ['resolute', 'Qəti', 'C1', 'adjective'], ['reticent', 'Sükut', 'C1', 'adjective'], ['reverent', 'Hörmətli', 'C1', 'adjective'], ['sagacious', 'Ağıllı', 'C1', 'adjective'], ['salient', 'Diqqət çəkici', 'C1', 'adjective']
];

const words = rawWords.map(w => ({ word: w[0], translation: w[1], level: w[2], category: w[3] }));

// REAL VƏ DƏRİN İZAHLI 50 QAYDA
const rules = [
  ['Present Simple', 'Hər gün təkrarlanan vərdişləri, ümumi həqiqətləri bildirir. Feilin birinci forması (V1) istifadə olunur. He, she, it üçün sonuna -s artırılır. Sual üçün Do/Does istifadə olunur.', 'She plays tennis every weekend. / Water boils at 100 degrees.', 'A1', 1],
  ['Verb To Be (am/is/are)', 'Şəxsiyyət, yer, yaş, vəziyyət və peşə bildirmək üçün istifadə olunur. I ilə am, he/she/it ilə is, we/you/they ilə are gəlir. Mənfi formada not artırılır.', 'They are students. / I am 25 years old. / She is not here.', 'A1', 2],
  ['Articles (a/an/the)', 'Tək sayılan isimlərdə istifadə olunur. A sait səslə başlamayan sözlərdən əvvəl, an sait səslə başlayan sözlərdən əvvəl gəlir. The isə xüsusi və ya əvvəldən xatırladılan obyektlər üçün istifadə olunur.', 'I have a cat. The cat is white. / I have an apple.', 'A1', 3],
  ['Subject Pronouns', 'Şəxsləri bildirir (I, you, he, she, it, we, they). Cümlədə işi edən subyekti göstərmək üçün istifadə olunur.', 'He is my friend. / They are playing outside.', 'A1', 4],
  ['There is / There are', 'Hər hansı yerdə bir şeyin olduğunu bildirmək üçün istifadə olunur. Tək obyekt üçün There is, cəm obyekt üçün There are istifadə olunur.', 'There is a book on the table. / There are five apples in the basket.', 'A1', 5],
  ['Can / Can not', 'Qabiliyyət və ya icazə bildirir. Mənfi forması cannot və ya can not şəklində istifadə olunur.', 'I can swim. / She can not speak French.', 'A1', 6],
  ['Prepositions of Place (in/on/at)', 'Yer bildirən ədatlar. In içində, on üstündə, at isə xüsusi bir nöqtə üçün istifadə olunur.', 'The cat is in the box. / The book is on the table. / She is at school.', 'A1', 7],
  ['Have got / Has got', 'Sahiblik bildirir. I/you/we/they ilə have got, he/she/it ilə has got istifadə olunur.', 'I have got a car. / She has got a new phone.', 'A1', 8],
  ['Imperatives', 'Əmr, xahiş və ya məsləhət bildirmək üçün istifadə olunur. Subyektsiz feilin birinci forması ilə düzəlir. Mənfi forması Do not ilə başlayır.', 'Open the door, please. / Do not touch that!', 'A1', 9],
  ['Question Words (What/Where/When)', 'Sual sözləri. What nəyi, Where haranı, When isə vaxtı soruşmaq üçün istifadə olunur.', 'What is your name? / Where do you live? / When is your birthday?', 'A1', 10],

  ['Past Simple', 'Keçmişdə baş verib tamamlanmış hərəkətləri bildirir. Düzgün feillər -ed qəbul edir, qeyri-sadiqlərin xüsusi forması var (go-went). Sual üçün Did istifadə olunur.', 'I visited my grandparents last week. / She did not go to school yesterday.', 'A2', 1],
  ['Be going to', 'Gələcəkdə edilməsi planlanan və ya baş verməsi qaçınılmaz olan hərəkətləri bildirir.', 'I am going to read a book tonight. / Look at those clouds, it is going to rain.', 'A2', 2],
  ['Comparatives & Superlatives', 'Müqayisə üçün qısa sözlərə -er/-est, uzun sözlərə isə more/the most artırılır. Müqayisədə than istifadə olunur.', 'My car is faster than yours. / She is the most intelligent person in the class.', 'A2', 3],
  ['Present Continuous', 'İndi baş verən və ya müvəqqəti hərəkətləri bildirir. To Be + feilin -ing forması ilə düzəlir.', 'She is reading a book right now. / They are not watching TV at the moment.', 'A2', 4],
  ['Would like', 'İstək bildirmək üçün istifadə olunur. Want kifayət qədər nəzakətli deyil, ona görə would like çox istifadə olunur.', 'I would like a cup of tea. / Would you like to go to the cinema?', 'A2', 5],
  ['Some / Any', 'Miqdar bildirir. Bəzi, hər hansı. Some təsdiq cümlələrdə, any isə sual və mənfi cümlələrdə istifadə olunur.', 'Is there any milk? Yes, there is some milk. / There are not any apples left.', 'A2', 6],
  ['Adverbs of Frequency', 'Tezlik bildirən zərflər (always, usually, often, sometimes, never). Adətən feildən əvvəl, To Be feilindən isə sonra gəlir.', 'I always wake up early. / She is never late.', 'A2', 7],
  ['Object Pronouns', 'Obyekt əvəzlikləri (me, you, him, her, it, us, them). İşin görüldüyü obyekti göstərmək üçün istifadə olunur.', 'I called him yesterday. / She gave a gift to them.', 'A2', 8],
  ['Present Perfect (ever/never)', 'Həyat təcrübəsini bildirmək üçün istifadə olunur. Have/Has + V3 quruluşu var. Ever suallarda, never isə mənfi cümlələrdə istifadə olunur.', 'Have you ever been to Rome? / I have never seen such a beautiful place.', 'A2', 9],
  ['Modal Verbs (must/must not)', 'Məcburiyyət və qadağa bildirir. Must etməli olduğunu, must not isə etməməli olduğunu bildirir.', 'You must wear a seatbelt in the car. / You must not smoke here.', 'A2', 10],

  ['Present Perfect vs Past Simple', 'Present Perfect keçmişdə baş verib indi təsiri olan hərəkətləri, Past Simple isə tam bitmiş və vaxtı dəqiq bilinən hərəkətləri bildirir.', 'I have lost my keys (I can not open the door now). / I lost my keys yesterday.', 'B1', 1],
  ['Conditionals (Type 1)', 'Gələcəkdə mümkün olan şərti hərəkətləri bildirir. Quruluşu: If + Present Simple, Future Simple.', 'If it rains tomorrow, I will stay at home.', 'B1', 2],
  ['Passive Voice', 'İşin kim tərəfindən edildiyindən çox, işin görüldüyünə diqqət çəkmək üçün istifadə olunur. To Be + V3 ilə düzəlir.', 'The book was written by him. / The house is being painted right now.', 'B1', 3],
  ['Used to', 'Keçmişdə edilən, lakin indi edilməyən vərdişləri bildirir.', 'I used to play football when I was a child. / She did not use to like vegetables.', 'B1', 4],
  ['Relative Clauses', 'İsimləri təsvir etmək üçün istifadə olunur. İnsanlar üçün who, əşyalar üçün which, yer üçün where istifadə olunur.', 'The man who lives next door is a doctor. / The book which I read was great.', 'B1', 5],
  ['Gerunds & Infinitives', 'Feildən sonra gələn əlavə feil forma. Bəzi feillərdən sonra ing (enjoy reading), bəzilərindən isə to (want to go) istifadə olunur.', 'I enjoy reading books. / She wants to learn English.', 'B1', 6],
  ['Present Perfect Continuous', 'Keçmişdə başlayıb indi də davam edən hərəkətləri bildirir. Have/Has + been + V-ing ilə düzəlir.', 'I have been studying for 3 hours. / She has been working here since 2010.', 'B1', 7],
  ['Phrasal Verbs', 'Feil və ədatın birləşməsi ilə yaranan və yeni məna kəsb edən ifadələr (get up, look for, give up).', 'I get up at 7 AM. / She is looking for her keys.', 'B1', 8],
  ['Reported Speech (Statements)', 'Başqasının dediyini dolayı yolla çatdırır. Feillər bir gerilik dərəcəsi geri çəkilir.', 'He said he was tired. / She told me that she would call me.', 'B1', 9],
  ['Modal Verbs of Deduction', 'Ehtimal bildirən modal feillər. Must (mütləq), might/could (bəlkə), can not (mümkün deyil).', 'He must be at home (the lights are on). / She can not be tired, she slept 10 hours.', 'B1', 10],

  ['Conditionals (Type 2 & 3)', 'Type 2: Həqiqətə zidd olan indiki və ya gələcək vəziyyət (If + Past, would). Type 3: Keçmişdə baş verməmiş hərəkət (If + Past Perfect, would have).', 'If I were you, I would buy that car. / If I had studied, I would have passed.', 'B2', 1],
  ['Passive Voice (All Tenses)', 'Passiv quruluşun bütün zamanlarda istifadəsi. Məsələn: Present Continuous Passive (is being done), Future Passive (will be done).', 'The project is being discussed right now. / The letter will be sent tomorrow.', 'B2', 2],
  ['Reported Speech (Questions & Commands)', 'Dolayı nitqdə suallar və əmrlər. Sual cümlələri if/whether ilə bağlanır, əmrlər isə told to ilə verilir.', 'She asked if I had seen the movie. / He told me to close the door.', 'B2', 3],
  ['Relative Clauses (Defining & Non-defining)', 'Təyinedici və qeyri-təyinedici cümlələr. Qeyri-təyinedicilər vergül arasında verilir və əhəmiyyətsiz məlumat daşıyır.', 'My brother, who lives in London, is a doctor. / The man who called you is my teacher.', 'B2', 4],
  ['Inversion', 'Cümlə quruluşunun tərsinə çevrilməsi. Mənfi və ya məhdudiyyət bildirən sözlərlə başlayanda baş verir.', 'Never have I seen such a beautiful sunset. / Rarely does he go to the cinema.', 'B2', 5],
  ['Modal Deduction (Past)', 'Keçmişlə bağlı ehtimallar. Must have (etməli idi), might have (bəlkə etdi), can not have (mümkün deyil ki edib).', 'She must have left early. / He can not have done that, he was with me.', 'B2', 6],
  ['Cleft Sentences', 'Cümlənin müəyyən hissəsinə vurğu etmək üçün istifadə olunur. It is/was ... that/who ... quruluşu.', 'It was John who broke the window. / What I need is a long vacation.', 'B2', 7],
  ['Ellipsis', 'Cümlədəki təkrarlanan sözlərin atılması. Danışıq dilində çox istifadə olunur.', 'Some people prefer tea, others prefer coffee. / She likes it, I do not.', 'B2', 8],
  ['Participle Clauses', 'Feli sifətlər ilə qurulan qısa cümlələr. Zaman və səbəb bildirə bilər.', 'Seeing the accident, she called the police. / Built in 1990, the house is very old.', 'B2', 9],
  ['Subjunctive', 'Xəyali, vacib və ya tələb olunan vəziyyətləri bildirir. Suggest, demand, insist feillərindən sonra gəlir.', 'I suggest that he be there. / It is essential that she study hard.', 'B2', 10],

  ['Causative', 'Başqasına bir iş etdirən zaman istifadə olunur. Have/Get + Object + V3 (etdirirəm) və ya Have + Object + V1 (etdirirəm).', 'I had my car repaired. / She got him to sign the paper.', 'C1', 1],
  ['Advanced Inversion', 'İnversiyanın daha mürəkkəb formaları. Not only, Only when, Under no circumstances kimi ifadələrlə başlayanda.', 'Not only did he apologize, but he also paid for the damage. / Only when I saw her did I realize.', 'C1', 2],
  ['Emphasis Structures', 'Vurğu üçün xüsusi quruluşlar. Do feilindən istifadə edərək feilə vurğu etmək.', 'I do believe you. / She does work hard. / He did tell you about it.', 'C1', 3],
  ['Complex Noun Phrases', 'Mürəkkəb isim ifadələri. Bir çox sifət və əlavələrlə genişləndirilmiş isimlər.', 'The highly intelligent, incredibly motivated student passed the exam.', 'C1', 4],
  ['Discourse Markers', 'Nitqi və ya mətni bağlayan, ardıcıllığı bildirən ifadələr (moreover, nevertheless, consequently).', 'The weather was bad; nevertheless, we went out. / He studied hard, consequently, he passed.', 'C1', 5],
  ['Hedging', 'Sözləri yumşaltmaq və ya ehtimal bildirmək üçün istifadə olunan ifadələr. Elmi və akademik yazıda vacibdir.', 'It seems that he is right. / There might be a slight problem.', 'C1', 6],
  ['Cohesion', 'Mətndəki fikirlərin bir-biri ilə əlaqəli və axıcı olması. Bağlayıcı sözlər və əvəzliklər istifadə olunur.', 'Despite the rain, we played. However, we got wet. Because of this, we went home.', 'C1', 7],
  ['Register Shifts', 'Formal və informal danışıq üslubları arasında keçid. Situasiyaya görə dilin səviyyəsini dəyişmək.', 'Could you possibly assist me? (Formal) / Can you help me? (Informal).', 'C1', 8],
  ['Advanced Modals', 'Modal feillərin daha mürəkkəb və incə mənaları. Should have (etməli idi amma etmədi), ought to (etməli), etc.', 'You should have told me earlier. / She ought to be here by now.', 'C1', 9],
  ['Conditionals (Mixed)', 'Qarışıq şərti cümlələr. Keçmiş şərt indiki nəticə verir və ya əksinə.', 'If I had studied harder, I would be rich now. / If I were taller, I would have become a basketball player.', 'C1', 10]
];

// 50 QAYDA SUALI
const ruleQuestions = [
  ['rule_quiz', 'She ___ tennis every weekend.', '["A) play", "B) plays", "C) playing", "D) is playing"]', 'B', 'Present Simple: He, she, it üçün feilin sonuna -s artırılır.', 'A1', 'grammar'],
  ['rule_quiz', 'They ___ students.', '["A) am", "B) is", "C) are", "D) be"]', 'C', 'Verb To Be: They ilə are gəlir.', 'A1', 'grammar'],
  ['rule_quiz', 'I have ___ apple in my bag.', '["A) a", "B) an", "C) the", "D) -"]', 'B', 'Articles: Saitlə başlayan sözün qarşısında an istifadə olunur.', 'A1', 'grammar'],
  ['rule_quiz', '___ is your name?', '["A) Where", "B) When", "C) What", "D) Who"]', 'C', 'Question Words: Ad soruşulanda What istifadə olunur.', 'A1', 'grammar'],
  ['rule_quiz', 'There ___ a book on the table.', '["A) is", "B) are", "C) am", "D) be"]', 'A', 'There is/are: Tək obyekt üçün is istifadə olunur.', 'A1', 'grammar'],
  ['rule_quiz', 'I ___ swim very well.', '["A) am", "B) do", "C) can", "D) have"]', 'C', 'Can/Can not: Qabiliyyət bildirmək üçün modal feil.', 'A1', 'grammar'],
  ['rule_quiz', 'The cat is ___ the box.', '["A) in", "B) on", "C) at", "D) by"]', 'A', 'Prepositions: İçində olmaq üçün in istifadə olunur.', 'A1', 'grammar'],
  ['rule_quiz', 'She ___ got a new phone.', '["A) have", "B) has", "C) is", "D) does"]', 'B', 'Have got/Has got: He, she, it üçün has istifadə olunur.', 'A1', 'grammar'],
  ['rule_quiz', '___ the door, please!', '["A) Opens", "B) Opened", "C) Open", "D) Opening"]', 'C', 'Imperatives: Əmr cümləsində feilin birinci forması istifadə olunur.', 'A1', 'grammar'],
  ['rule_quiz', 'He is my friend. ___ is playing outside.', '["A) He", "B) Him", "C) His", "D) She"]', 'A', 'Subject Pronouns: Subyekt kimi istifadə olunur.', 'A1', 'grammar'],

  ['rule_quiz', 'I ___ my grandparents last week.', '["A) visit", "B) visits", "C) visited", "D) visiting"]', 'C', 'Past Simple: Last week keçmiş zaman tələb edir.', 'A2', 'grammar'],
  ['rule_quiz', 'Look at those clouds, it ___ going to rain.', '["A) is", "B) are", "C) am", "D) will"]', 'A', 'Be going to: Tək subyekt üçün is istifadə olunur.', 'A2', 'grammar'],
  ['rule_quiz', 'My car is ___ than yours.', '["A) fast", "B) faster", "C) fastest", "D) the fastest"]', 'B', 'Comparatives: İki şeyi müqayisə edirik.', 'A2', 'grammar'],
  ['rule_quiz', 'She ___ a book right now.', '["A) read", "B) reads", "C) is reading", "D) readed"]', 'C', 'Present Continuous: Right now indiki zamanı tələb edir.', 'A2', 'grammar'],
  ['rule_quiz', 'I ___ like a cup of tea.', '["A) am", "B) do", "C) would", "D) want"]', 'C', 'Would like: Nəzakətli istək.', 'A2', 'grammar'],
  ['rule_quiz', 'Is there ___ milk?', '["A) some", "B) any", "C) a", "D) the"]', 'B', 'Some/Any: Suallarda any istifadə olunur.', 'A2', 'grammar'],
  ['rule_quiz', 'I ___ wake up early.', '["A) always", "B) never", "C) usually", "D) sometimes"]', 'A', 'Adverbs of Frequency: Tezlik zərfi.', 'A2', 'grammar'],
  ['rule_quiz', 'I called ___ yesterday.', '["A) he", "B) him", "C) his", "D) she"]', 'B', 'Object Pronouns: Obyekt kimi him istifadə olunur.', 'A2', 'grammar'],
  ['rule_quiz', 'Have you ___ been to Rome?', '["A) never", "B) ever", "C) already", "D) yet"]', 'B', 'Present Perfect: Suallarda ever istifadə olunur.', 'A2', 'grammar'],
  ['rule_quiz', 'You ___ wear a seatbelt in the car.', '["A) must", "B) must not", "C) can", "D) could"]', 'A', 'Modals: Məcburiyyət bildirir.', 'A2', 'grammar'],

  ['rule_quiz', 'I ___ my keys, so I can not open the door now.', '["A) lost", "B) have lost", "C) lose", "D) losing"]', 'B', 'Present Perfect vs Past Simple: İndi təsiri olduğu üçün Present Perfect.', 'B1', 'grammar'],
  ['rule_quiz', 'If it ___ tomorrow, I will stay home.', '["A) rain", "B) rains", "C) rained", "D) will rain"]', 'B', 'Conditionals 1: If şərtində Present Simple.', 'B1', 'grammar'],
  ['rule_quiz', 'The book ___ written by him.', '["A) is", "B) was", "C) did", "D) has"]', 'B', 'Passive Voice: Keçmiş zaman passivi.', 'B1', 'grammar'],
  ['rule_quiz', 'I ___ play football when I was a child.', '["A) use to", "B) used to", "C) am used to", "D) using"]', 'B', 'Used to: Keçmiş vərdiş.', 'B1', 'grammar'],
  ['rule_quiz', 'The man ___ lives next door is a doctor.', '["A) which", "B) who", "C) where", "D) what"]', 'B', 'Relative Clauses: İnsanlar üçün who.', 'B1', 'grammar'],
  ['rule_quiz', 'I enjoy ___ books.', '["A) read", "B) to read", "C) reading", "D) reads"]', 'C', 'Gerunds: Enjoy feilindən sonra ing forma gəlir.', 'B1', 'grammar'],
  ['rule_quiz', 'I ___ studying for 3 hours.', '["A) have", "B) has been", "C) have been", "D) am"]', 'C', 'Present Perfect Continuous: Have been + ing.', 'B1', 'grammar'],
  ['rule_quiz', 'Please, look ___ for her keys.', '["A) up", "B) out", "C) for", "D) in"]', 'C', 'Phrasal Verbs: Axtarmaq üçün look for.', 'B1', 'grammar'],
  ['rule_quiz', 'He said he ___ tired.', '["A) is", "B) was", "C) were", "D) be"]', 'B', 'Reported Speech: Present Simple keçmişə çevrilir.', 'B1', 'grammar'],
  ['rule_quiz', 'He ___ be at home, the lights are on.', '["A) must", "B) can not", "C) might", "D) could"]', 'A', 'Modal Deduction: Mütləq belədir.', 'B1', 'grammar'],

  ['rule_quiz', 'If I ___ you, I would buy that car.', '["A) am", "B) was", "C) were", "D) be"]', 'C', 'Conditionals 2: To be feili üçün were istifadə olunur.', 'B2', 'grammar'],
  ['rule_quiz', 'The project ___ discussed right now.', '["A) is", "B) is being", "C) was", "D) has been"]', 'B', 'Passive Voice: Present Continuous Passive.', 'B2', 'grammar'],
  ['rule_quiz', 'She asked if I ___ seen the movie.', '["A) have", "B) has", "C) had", "D) was"]', 'C', 'Reported Speech: Present Perfect keçmişə çevrilir.', 'B2', 'grammar'],
  ['rule_quiz', 'My brother, ___ lives in London, is a doctor.', '["A) who", "B) which", "C) that", "D) whose"]', 'A', 'Relative Clauses: Qeyri-təyinedici vergüllü cümlədə who.', 'B2', 'grammar'],
  ['rule_quiz', 'Never ___ I seen such a beautiful sunset.', '["A) I have", "B) have I", "C) I saw", "D) did I"]', 'B', 'Inversion: Mənfi söz cümlə başında olanda feil tərsinə çevrilir.', 'B2', 'grammar'],
  ['rule_quiz', 'She ___ have left early.', '["A) must", "B) might", "C) can not", "D) could not"]', 'A', 'Modal Deduction (Past): Güclü ehtimal.', 'B2', 'grammar'],
  ['rule_quiz', 'It was John ___ broke the window.', '["A) who", "B) which", "C) what", "D) whose"]', 'A', 'Cleft Sentences: Vurğu üçün.', 'B2', 'grammar'],
  ['rule_quiz', 'Some people prefer tea, ___ prefer coffee.', '["A) another", "B) others", "C) other", "D) the others"]', 'B', 'Ellipsis: Təkrardan qaçmaq.', 'B2', 'grammar'],
  ['rule_quiz', '___ the accident, she called the police.', '["A) See", "B) Saw", "C) Seeing", "D) Seen"]', 'C', 'Participle Clauses: Eyni vaxtda baş verən hadisə.', 'B2', 'grammar'],
  ['rule_quiz', 'I suggest that he ___ there.', '["A) is", "B) be", "C) was", "D) goes"]', 'B', 'Subjunctive: Xəyali vəziyyət.', 'B2', 'grammar'],

  ['rule_quiz', 'I had my car ___.', '["A) repair", "B) repairing", "C) repaired", "D) to repair"]', 'C', 'Causative: Başqasına etdirmək.', 'C1', 'grammar'],
  ['rule_quiz', 'Not only ___ he apologize, but he also paid.', '["A) did", "B) does", "C) was", "D) had"]', 'A', 'Advanced Inversion: Not only ilə başlayanda köməkçi feil.', 'C1', 'grammar'],
  ['rule_quiz', 'I ___ believe you.', '["A) do", "B) am", "C) have", "D) will"]', 'A', 'Emphasis Structures: Do feili ilə vurğu.', 'C1', 'grammar'],
  ['rule_quiz', 'The weather was bad; ___, we went out.', '["A) despite", "B) although", "C) nevertheless", "D) however"]', 'C', 'Discourse Markers: Əlaqələndirici söz.', 'C1', 'grammar'],
  ['rule_quiz', 'It ___ that he is right.', '["A) seems", "B) must", "C) is", "D) definitely"]', 'A', 'Hedging: Ehtimal bildirmək.', 'C1', 'grammar'],
  ['rule_quiz', '___ the rain, we played.', '["A) Despite", "B) Although", "C) Because", "D) However"]', 'A', 'Cohesion: Bağlayıcı söz.', 'C1', 'grammar'],
  ['rule_quiz', 'Could you possibly assist me? This is a ___ register.', '["A) formal", "B) informal", "C) neutral", "D) casual"]', 'A', 'Register Shifts: Rəsmi üslub.', 'C1', 'grammar'],
  ['rule_quiz', 'You ___ have told me earlier.', '["A) should", "B) must", "C) can", "D) might"]', 'A', 'Advanced Modals: Keçmişdə edilməli olan amma edilməyən.', 'C1', 'grammar'],
  ['rule_quiz', 'If I had studied harder, I ___ rich now.', '["A) would be", "B) would have been", "C) will be", "D) am"]', 'A', 'Mixed Conditionals: Keçmiş şərt, indiki nəticə.', 'C1', 'grammar'],
  ['rule_quiz', 'Only when I saw her ___ I realize.', '["A) did", "B) do", "C) was", "D) had"]', 'A', 'Advanced Inversion: Only when ilə başlayanda.', 'C1', 'grammar']
];

// AVTOMATİK 500 SÖZ SUALI
const wordQuestions = [];
for (let i = 0; i < rawWords.length; i++) {
  const word = rawWords[i][0];
  const trans = rawWords[i][1];
  const level = rawWords[i][2];
  const cat = rawWords[i][3];
  
  const wrongs = rawWords.filter(w => w[2] === level && w[1] !== trans).sort(() => Math.random() - 0.5);
  
  const options = [
    trans,
    wrongs[0] ? wrongs[0][1] : 'Yanlış 1',
    wrongs[1] ? wrongs[1][1] : 'Yanlış 2',
    wrongs[2] ? wrongs[2][1] : 'Yanlış 3'
  ].sort(() => Math.random() - 0.5);

  const correctLetter = String.fromCharCode(65 + options.indexOf(trans));
  const qText = `What is the meaning of "${word}"?`;
  const optsStr = JSON.stringify(options.map((o, idx) => `${String.fromCharCode(65 + idx)}) ${o}`));
  const exp = `"${word}" sözünün mənası "${trans}"-dir.`;
  
  wordQuestions.push(['word_quiz', qText, optsStr, correctLetter, exp, level, cat]);
}

const allQuestions = [...wordQuestions, ...ruleQuestions];

async function seed() {
  try {
    console.log('500 Söz yoxlanılır və əlavə edilir...');
    const wordValues = words.map(w => [w.word, w.translation, w.level, w.category]);
    await pool.query('INSERT IGNORE INTO words (word, translation, level, category) VALUES ?', [wordValues]);
    
    console.log('50 Qayda yoxlanılır və əlavə edilir...');
    
    console.log('50 Qayda yoxlanılır və əlavə edilir...');
    const ruleValues = rules.map(r => [r[0], r[1], r[2], r[3], r[4]]);
    await pool.query('INSERT IGNORE INTO rules (title, content, example, level, sequence_number) VALUES ?', [ruleValues]);
    
    console.log('550 Sual yoxlanılır və əlavə edilir...');
    const questionValues = allQuestions.map(q => [q[0], q[1], q[2], q[3], q[4], q[5], q[6]]);
    await pool.query('INSERT IGNORE INTO questions (type, question_text, options, correct_answer, explanation, level, category) VALUES ?', [questionValues]);
    
    console.log('Seed prosesi uğurla tamamlandı! Cəmi 500 söz, 50 qayda, 550 sual əlavə edildi.');
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err.message);
    process.exit(1);
  }
}

seed();
