import { useLang } from '../i18n';

interface Props {
  onClose: () => void;
}

function F({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-2 overflow-x-auto rounded-md border border-white/10 bg-black/50 px-3 py-2 font-mono text-[11.5px] leading-relaxed whitespace-pre text-cyan-200/90">
      {children}
    </div>
  );
}

function H({ children }: { children: React.ReactNode }) {
  return <h3 className="mt-5 mb-1.5 text-[13px] font-semibold tracking-wide text-violet-300">{children}</h3>;
}

export default function PhysicsModal({ onClose }: Props) {
  const { lang, t } = useLang();
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="max-h-[88vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-white/10 bg-slate-950 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-white/10 bg-slate-950/95 px-5 py-3 backdrop-blur">
          <h2 className="font-mono text-xs tracking-[0.2em] text-slate-200 uppercase">
            {t.pmTitle}
          </h2>
          <button
            onClick={onClose}
            className="rounded-md border border-white/10 px-2 py-1 text-xs text-slate-400 transition hover:border-white/25 hover:text-white"
          >
            {t.pmClose}
          </button>
        </div>

        <div className="px-5 pt-1 pb-6 text-[12.5px] leading-relaxed text-slate-400">
          {lang === 'tr' ? <BodyTR /> : <BodyEN />}
        </div>
      </div>
    </div>
  );
}

function BodyTR() {
  return (
    <>
      <H>1 · Fikir</H>
      <p>
        Dönen (Kerr) bir kara deliğin kütlesinin bir kısmı <strong className="text-slate-200">dönme enerjisidir</strong> ve
        bu kısım prensipte geri alınabilir. Roger Penrose'un 1969'da önerdiği süreçte, ergosfer içine
        gönderilen bir parçacık ikiye ayrılır: bir parça <em>negatif enerjili</em> bir yörüngeye girip ufka
        düşer, diğeri ise gönderdiğimizden <em>daha fazla enerjiyle</em> kaçar. Kara deliğin kütlesi azalır,
        spini yavaşlar; fark bizim elektrik şebekemize gider.
      </p>

      <H>2 · Ergosfer ve çerçeve sürüklenmesi</H>
      <p>
        Ekvator düzleminde Boyer–Lindquist koordinatlarında (G = c = 1, M = 1):
      </p>
      <F>{`Δ(r) = r² − 2r + a²            A(r) = (r²+a²)² − Δa²
r₊    = 1 + √(1−a²)   (olay ufku)
r_E   = 2             (ergosfer sınırı, ekvator)
ω(r)  = 2ar/A         (çerçeve sürüklenme açısal hızı)
α(r)  = r√(Δ/A)       (lapse)
g_tt  = −(1 − 2/r)    →  r < 2 iken POZİTİF`}</F>
      <p>
        r &lt; 2M bölgesinde g_tt işaret değiştirir. Bunun anlamı: hiçbir gözlemci sabit duramaz, herkes
        kara delikle birlikte dönmek <em>zorundadır</em>. Ve kritik olarak, enerji E = −p_t artık pozitif
        olmak zorunda değildir.
      </p>

      <H>3 · Simülasyonun çözdüğü denklemler</H>
      <p>Her parçacık gerçek Kerr jeodeziğidir (RK4 ile afin parametrede entegre edilir):</p>
      <F>{`(r² dr/dλ)² = R(r) = P² − Δ[μ²r² + (L − aE)²],   P = E(r²+a²) − La
r² dφ/dλ    = (L − aE) + aP/Δ
r² dt/dλ    = a(L − aE) + (r²+a²)P/Δ`}</F>
      <p>
        μ = 1 kütleli besleme parçacığı, μ = 0 bölünme sonrası fotonlar. R(r) &lt; 0 olduğu yerde dönüş
        noktası vardır — demetin açısal momentumu fazlaysa parçacık ergosfere giremeden <em>geri seker</em>.
      </p>

      <H>4 · Bölünme: 4-momentum tam olarak korunur</H>
      <p>
        Ana parçacık kendi durgun çerçevesinde zıt yönlü iki fotona ayrılır. u ana parçacığın 4-hızı,
        n ise u'ya dik birim uzaysal vektör olmak üzere:
      </p>
      <F>{`p_A = ½(u + n),   p_B = ½(u − n)   ⟹   p_A + p_B = u   (tam korunum)
E_A = −p_A,t = ½(E_p − n_t)
n_t 'yi maksimize eden yön:  n = ξ⊥/|ξ⊥| ,  ξ⊥ = ∂_t − E_p·u
⟹  n_t^max = √(E_p² + g_tt) = √(E_p² + 2/r − 1)`}</F>
      <p>
        Ergosferin içinde (r &lt; 2M) karekök E_p'yi aşar ve <strong className="text-rose-300">E_A &lt; 0</strong> olur.
        ψ kaydırıcısı bu optimal eksenden sapmayı verir: n_t = cos ψ · √(E_p²+g_tt). ψ büyüdükçe negatif
        enerji kaybolur ve reaktör çıkışı sıfırlanır — ayarın ne kadar hassas olduğunu gösterir.
      </p>

      <H>5 · Verim tavanı</H>
      <F>{`η = ½[√(E_p² + 2/r − 1) − E_p] / E_p
r → r₊ = M  ve  a → 1  ,  E_p = 1  :
η_max = (√2 − 1)/2 = 0.2071…  →  %20.7`}</F>
      <p>
        Karşılaştırma: fisyon %0.09, füzyon %0.4, ince disk birikimi (a=0.998) %32, Blandford–Znajek
        manyetik çekim daha da fazlasını verebilir. Penrose süreci ise "yakıtsız" çalışır — yalnızca
        kara deliğin dönüşünü tüketir.
      </p>

      <H>6 · Termodinamik sınır: alan teoremi</H>
      <p>Yutulan negatif enerjili foton için kütle ve açısal momentum değişimi:</p>
      <F>{`δM = E_A < 0 ,  δJ = L_A < 0
Hawking alan teoremi:  δM ≥ Ω_H δJ   ⟹   δM_irr ≥ 0
M_irr = √(M r₊ /2)   (indirgenemez kütle — asla azalamaz)
Çıkarılabilir maksimum enerji:  E_rot = (M − M_irr)c² ≤ 0.29 Mc²`}</F>
      <p>
        Simülasyon her olayda bu eşitsizliği sağlar: ufuk alanı artar, ama toplam kütle azalır.
        a* = 1'den a* = 0'a inildiğinde kütlenin %29'u enerjiye dönüşmüştür ve geriye Schwarzschild
        kara deliği, yani "ölü yakıt" kalır. Reaktörü yeniden doldurmanın tek yolu prograd madde
        biriktirip (ISCO kolu) spini geri yüklemektir — bu da Thorne limiti a* ≈ 0.998'de doyar.
      </p>

      <H>7 · Bu simülasyonun bulduğu mühendislik gerçeği</H>
      <p>
        Kaçan parçanın gerçekten kaçabilmesi için ana parçacık bölünme anında{' '}
        <strong className="text-slate-200">radyal olarak durmuş olmalıdır</strong> (dönüş noktası, dr/dτ = 0).
        Aksi halde her iki parça da içeri doğru huzmelenir ve enerji taşıyan foton da yutulur — reaktör
        kara deliği <em>besleyen</em> bir makineye dönüşür. Bu kısıt iki sert sonuç doğurur:
      </p>
      <F>{`• Ergosfer içinde dönüş noktası ancak a* ≳ 0.78 için oluşur.
  Daha yavaş dönen kara delikte Penrose çevrimi ÇALIŞMAZ.
• Demet toleransı ~%1 : L açısal momentumunda %0.7'lik bir sapma
  dönüş noktasını tamamen yok eder.  (jitter kaydırıcısını deneyin)`}</F>
      <p>
        Simülatör her kare bu kısıtları çözer: hedef yarıçap için (E, L) çiftini bulur, jitter'in en kötü
        durumunda bile dönüş noktasının var olacağı en derin yarıçapı seçer ve emisyon eksenini kaçışı
        garantileyen açılar arasından verimi maksimize edecek şekilde tarar.
      </p>
      <p className="mt-2">Birim durgun kütle başına tam enerji dengesi (y = toplama verimi):</p>
      <F>{`kara deliğe : E_neg + (1−y)·E_esc        toplayıcıya : y·E_esc
şebekeye net: y·E_esc − E_p             ve  E_neg + E_esc = E_p
⟹ y < E_p/E_esc olursa reaktör NET TÜKETİCİ olur.`}</F>

      <H>8 · Mikro ve makro bağlantısı</H>
      <p>
        Ekranda gördüğünüz onlarca parçacık, saniyede ~10³⁰ olayın <em>yavaşlatılmış örneğidir</em>.
        Makro muhasebe, bu olaylardan ölçülen ortalama ⟨E_A⟩, ⟨L_A⟩ ve toplama verimliliğini kullanır:
      </p>
      <F>{`M′  = M + ṁΔt⟨E_A⟩ − P_Hawking Δt/c²
a*′ = (a* M² + ṁΔt⟨L_A⟩ M) / M′²
P   = ṁ ⟨gain⟩ c² × (toplama verimi)`}</F>

      <H>9 · Dürüst olalım: basitleştirmeler</H>
      <ul className="ml-4 list-disc space-y-1">
        <li>Her şey ekvator düzleminde; yörünge eğikliği ve θ hareketi yok.</li>
        <li>Parçacıklar test cismi: kendi kütleçekimleri ve geri tepki ışıması ihmal edilir.</li>
        <li>Toplayıcı halka %100 verimli bir "mükemmel soğurucu" olarak modellenmiştir.</li>
        <li>Ergosfere mermi göndermenin mekanik maliyeti (hızlandırıcı verimi) hesaba katılmaz.</li>
        <li>
          Gerçek astrofizikte Penrose süreci pratik değildir: parçaların yeterince hızlı ayrılması
          için göreli hızlar gerekir. Doğa bunun yerine manyetik Blandford–Znajek mekanizmasını kullanır.
          Buna rağmen fizik gerçektir — bu bir mühendislik fantezisi, bir fizik hatası değil.
        </li>
      </ul>
    </>
  );
}

function BodyEN() {
  return (
    <>
      <H>1 · The idea</H>
      <p>
        Part of the mass of a rotating (Kerr) black hole is <strong className="text-slate-200">rotational energy</strong>,
        and in principle that part can be taken back out. In the process Roger Penrose proposed in 1969, a particle
        sent into the ergosphere splits in two: one piece enters a <em>negative-energy</em> orbit and falls through
        the horizon, while the other escapes with <em>more energy</em> than we sent in. The black hole loses mass and
        spins down; the difference goes to our power grid.
      </p>

      <H>2 · Ergosphere and frame dragging</H>
      <p>In the equatorial plane, in Boyer–Lindquist coordinates (G = c = 1, M = 1):</p>
      <F>{`Δ(r) = r² − 2r + a²            A(r) = (r²+a²)² − Δa²
r₊    = 1 + √(1−a²)   (event horizon)
r_E   = 2             (ergosphere boundary, equator)
ω(r)  = 2ar/A         (frame-dragging angular velocity)
α(r)  = r√(Δ/A)       (lapse)
g_tt  = −(1 − 2/r)    →  POSITIVE for r < 2`}</F>
      <p>
        Inside r &lt; 2M, g_tt changes sign. This means no observer can stay at rest: everyone is <em>forced</em> to
        co-rotate with the black hole. And, crucially, the energy E = −p_t no longer has to be positive.
      </p>

      <H>3 · Equations the simulation solves</H>
      <p>Every particle follows a true Kerr geodesic (integrated with RK4 in the affine parameter):</p>
      <F>{`(r² dr/dλ)² = R(r) = P² − Δ[μ²r² + (L − aE)²],   P = E(r²+a²) − La
r² dφ/dλ    = (L − aE) + aP/Δ
r² dt/dλ    = a(L − aE) + (r²+a²)P/Δ`}</F>
      <p>
        μ = 1 for the massive feed particle, μ = 0 for the photons after the split. Where R(r) &lt; 0 there is a
        turning point — if the beam carries too much angular momentum, the particle <em>bounces back</em> before it
        can enter the ergosphere.
      </p>

      <H>4 · The split: four-momentum is conserved exactly</H>
      <p>
        In its own rest frame the parent particle decays into two photons moving in opposite directions. With u the
        parent's four-velocity and n a unit spacelike vector orthogonal to u:
      </p>
      <F>{`p_A = ½(u + n),   p_B = ½(u − n)   ⟹   p_A + p_B = u   (exact conservation)
E_A = −p_A,t = ½(E_p − n_t)
direction that maximizes n_t:  n = ξ⊥/|ξ⊥| ,  ξ⊥ = ∂_t − E_p·u
⟹  n_t^max = √(E_p² + g_tt) = √(E_p² + 2/r − 1)`}</F>
      <p>
        Inside the ergosphere (r &lt; 2M) the square root exceeds E_p, so{' '}
        <strong className="text-rose-300">E_A &lt; 0</strong>. The ψ slider tilts the emission away from this optimal
        axis: n_t = cos ψ · √(E_p²+g_tt). As ψ grows the negative energy disappears and the reactor output drops to
        zero — a measure of how delicate the tuning is.
      </p>

      <H>5 · Efficiency ceiling</H>
      <F>{`η = ½[√(E_p² + 2/r − 1) − E_p] / E_p
r → r₊ = M  and  a → 1 ,  E_p = 1 :
η_max = (√2 − 1)/2 = 0.2071…  →  20.7%`}</F>
      <p>
        For comparison: fission 0.09%, fusion 0.4%, thin-disk accretion (a = 0.998) 32%, and magnetic
        Blandford–Znajek extraction can deliver even more. The Penrose process, however, runs "without fuel" — it
        only consumes the black hole's rotation.
      </p>

      <H>6 · The thermodynamic limit: the area theorem</H>
      <p>Change in mass and angular momentum when a negative-energy photon is swallowed:</p>
      <F>{`δM = E_A < 0 ,  δJ = L_A < 0
Hawking area theorem:  δM ≥ Ω_H δJ   ⟹   δM_irr ≥ 0
M_irr = √(M r₊ /2)   (irreducible mass — can never decrease)
Maximum extractable energy:  E_rot = (M − M_irr)c² ≤ 0.29 Mc²`}</F>
      <p>
        The simulation enforces this inequality at every event: the horizon area grows, yet the total mass falls.
        Going from a* = 1 down to a* = 0 turns 29% of the mass into energy and leaves behind a Schwarzschild black
        hole — "spent fuel". The only way to refuel the reactor is to accrete prograde matter (the ISCO branch) and
        restore the spin, which saturates at the Thorne limit a* ≈ 0.998.
      </p>

      <H>7 · The engineering fact this simulation uncovers</H>
      <p>
        For the escaping piece to actually escape, the parent particle must be{' '}
        <strong className="text-slate-200">radially at rest</strong> at the moment of the split (a turning point,
        dr/dτ = 0). Otherwise both pieces are beamed inward and the energy-carrying photon is swallowed too — the
        reactor turns into a machine that <em>feeds</em> the black hole. This constraint has two harsh consequences:
      </p>
      <F>{`• A turning point inside the ergosphere exists only for a* ≳ 0.78.
  For a slower black hole the Penrose cycle DOES NOT WORK.
• Beam tolerance ~1% : a 0.7% error in the angular momentum L
  wipes out the turning point entirely.  (try the jitter slider)`}</F>
      <p>
        The simulator solves these constraints every frame: it finds the (E, L) pair for the target radius, picks the
        deepest radius at which a turning point still exists even for the worst-case jitter, and scans the emission
        axis over the angles that guarantee escape to maximize the efficiency.
      </p>
      <p className="mt-2">Full energy balance per unit rest mass (y = collection yield):</p>
      <F>{`into the hole : E_neg + (1−y)·E_esc        to the collector : y·E_esc
net to grid   : y·E_esc − E_p              and  E_neg + E_esc = E_p
⟹ if y < E_p/E_esc the reactor becomes a NET CONSUMER.`}</F>

      <H>8 · Linking micro and macro</H>
      <p>
        The few dozen particles on screen are a <em>slowed-down sample</em> of ~10³⁰ events per second. The macro
        bookkeeping uses the averages ⟨E_A⟩, ⟨L_A⟩ and the collection yield measured from these events:
      </p>
      <F>{`M′  = M + ṁΔt⟨E_A⟩ − P_Hawking Δt/c²
a*′ = (a* M² + ṁΔt⟨L_A⟩ M) / M′²
P   = ṁ ⟨gain⟩ c² × (collection yield)`}</F>

      <H>9 · Being honest: simplifications</H>
      <ul className="ml-4 list-disc space-y-1">
        <li>Everything happens in the equatorial plane; no orbital inclination or θ motion.</li>
        <li>Particles are test bodies: their own gravity and radiation reaction are neglected.</li>
        <li>The collector ring is modelled as a 100% efficient "perfect absorber".</li>
        <li>The mechanical cost of firing projectiles into the ergosphere (accelerator efficiency) is not counted.</li>
        <li>
          In real astrophysics the Penrose process is impractical: the fragments need relativistic relative speeds to
          separate fast enough. Nature uses the magnetic Blandford–Znajek mechanism instead. Even so, the physics is
          real — this is an engineering fantasy, not a physics mistake.
        </li>
      </ul>
    </>
  );
}
