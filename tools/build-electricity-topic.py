#!/usr/bin/env python3
"""Build a bilingual, deterministic electricity question bank. All values are synthetic exercises."""
import base64, gzip, json, math
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
SOURCES = [
 {'id':'threephase', 'title':'MIT 6.061: Polyphase Networks', 'url':'https://ocw.mit.edu/courses/6-061-introduction-to-electric-power-systems-spring-2011/c6393a58319200a5344752de0cf47ec4_MIT6_061S11_ch3.pdf'},
 {'id':'pf', 'title':'Texas Instruments: Power factor and harmonic distortion', 'url':'https://www.ti.com/document-viewer/lit/html/SSZTDA4/GUID-74DF7FDF-F08C-47CF-951A-00619A2BE84E'},
 {'id':'transformer', 'title':'IIT Madras / NPTEL: Transformer efficiency', 'url':'https://archive.nptel.ac.in/content/storage2/courses/108106071/pdfs/1_10.pdf'},
 {'id':'matching', 'title':'MIT: Maximum Power Transfer in a Circuit', 'url':'https://ocw.mit.edu/courses/6-101-introductory-analog-electronics-laboratory-spring-2007/7faf76f06ceb6721c2071a3e7ff9776e_max_power.pdf'},
 {'id':'ac', 'title':'MIT: AC circuits, resonance and power', 'url':'https://ocw.mit.edu/courses/8-02t-electricity-and-magnetism-spring-2005/77f396b6d9907db677e2b94da90613be_cha12ac_circuits.pdf'},
 {'id':'machines', 'title':'MIT 6.061: induction machines', 'url':'https://ocw.mit.edu/courses/6-061-introduction-to-electric-power-systems-spring-2011/01f878366fe651f1b95e9ed7fc24c644_MIT6_061S11_ch10.pdf'},
 {'id':'buck', 'title':'Texas Instruments: Basic Calculation of a Buck Converter Power Stage', 'url':'https://www.ti.com/lit/an/slva477b/slva477b.pdf'}
]
questions=[]
def n(x, places=2):
    return f'{x:.{places}f}'.rstrip('0').rstrip('.')
def add(group, k, category, category_en, text, text_en, correct, wrong, solution, solution_en, hint, hint_en, inputs, expected, source_ids):
    assert len(wrong)==3 and len(set([correct,*wrong]))==4
    # Different correct positions. Option IDs are stable across language changes.
    labels=[correct,*wrong]; offset=(len(questions)+1)%4
    labels=labels[offset:]+labels[:offset]
    options=[{'id':f'o{i}', 'label':label} for i,label in enumerate(labels)]
    q={'id':f'ee-{group}-{k}', 'group':group, 'difficulty':1, 'category':category,
       'text':text, 'options':options, 'correctOptionId':f'o{labels.index(correct)}',
       'explanation':solution, 'hint':hint, 'sourceIds':source_ids,
       'calculation':{'inputs':inputs,'expected':expected},
       'translations':{'en':{'category':category_en,'text':text_en,'hint':hint_en,'explanation':solution_en}}}
    questions.append(q)
# RMS throughout; ideal or simplified models are explicitly stated in each problem.
for k,(u,r,x) in enumerate([(100,8,6),(200,12,16),(120,6,8)],1):
    i=u/math.hypot(r,x); p=i*i*r; q=i*i*x
    correct=f'I = {n(i)} A; P = {n(p)} W; Q = +{n(q)} var'
    wrong=[f'I = {n(u/r)} A; P = {n(u*u/r)} W; Q = 0 var',f'I = {n(i)} A; P = {n(q)} W; Q = +{n(p)} var',f'I = {n(i)} A; P = {n(p)} W; Q = −{n(q)} var']
    add('ac',k,'Obwody AC','AC circuits',f'Szeregowy odbiornik ma Z = {r} + j{x} Ω i jest zasilany napięciem sinusoidalnym {u} V RMS. Jakie są I RMS, moc czynna P i moc bierna Q?',f'A series load has Z = {r} + j{x} Ω and a sinusoidal supply of {u} V RMS. What are I RMS, active power P and reactive power Q?',correct,wrong,
        f'|Z| = √({r}² + {x}²) = {n(math.hypot(r,x))} Ω. I = U/|Z| = {n(i)} A. P = I²R = {n(p)} W; Q = I²X = +{n(q)} var (indukcyjna).',f'|Z| = √({r}² + {x}²) = {n(math.hypot(r,x))} Ω. I = U/|Z| = {n(i)} A. P = I²R = {n(p)} W; Q = I²X = +{n(q)} var (inductive).','Policz moduł impedancji; moce wyznacz z I²R oraz I²X.','Find the impedance magnitude; use I²R and I²X.',{'u':u,'r':r,'x':x},{'i':i,'p':p,'q':q},['ac'])
for k,(r,l,c) in enumerate([(10,.1,10e-6),(20,.05,5e-6),(5,.02,20e-6)],1):
    f=1/(2*math.pi*math.sqrt(l*c)); quality=math.sqrt(l/c)/r
    correct=f'f₀ ≈ {n(f)} Hz; Q = {n(quality)}'
    wrong=[f'f₀ ≈ {n(f*2)} Hz; Q = {n(quality)}',f'f₀ ≈ {n(f)} Hz; Q = {n(1/quality)}',f'f₀ ≈ {n(f/2)} Hz; Q = {n(quality*2)}']
    add('rlc',k,'Rezonans','Resonance',f'Idealne L = {n(l*1000)} mH i C = {n(c*1e6)} µF połączono szeregowo z R = {r} Ω. Oblicz częstotliwość rezonansu i dobroć Q tego obwodu RLC.',f'Ideal L = {n(l*1000)} mH and C = {n(c*1e6)} µF are in series with R = {r} Ω. Find the resonance frequency and quality factor Q of this RLC circuit.',correct,wrong,
        f'f₀ = 1/(2π√LC) ≈ {n(f)} Hz. Q = ω₀L/R = √(L/C)/R = {n(quality)}. Tutaj Q oznacza dobroć, nie moc bierną.',f'f₀ = 1/(2π√LC) ≈ {n(f)} Hz. Q = ω₀L/R = √(L/C)/R = {n(quality)}. Here Q denotes quality factor, not reactive power.','W rezonansie ωL = 1/(ωC). Uwzględnij przeliczenie mH i µF.','At resonance ωL = 1/(ωC). Convert mH and µF to SI units.',{'r':r,'l':l,'c':c},{'f':f,'quality':quality},['ac'])
for k,(u,r,x) in enumerate([(400,12,9),(400,8,6),(400,24,18)],1):
    i=u/(math.sqrt(3)*math.hypot(r,x)); p=3*i*i*r/1000
    correct=f'I = {n(i)} A; P = {n(p)} kW'
    wrong=[f'I = {n(i*math.sqrt(3))} A; P = {n(p*3)} kW',f'I = {n(i)} A; P = {n(p/3)} kW',f'I = {n(i/math.sqrt(3))} A; P = {n(p/3)} kW']
    add('threephase',k,'Układy trójfazowe','Three-phase systems',f'Symetryczny odbiornik w gwiazdę ma impedancję każdej fazy {r} + j{x} Ω. Sinusoidalne napięcie międzyfazowe wynosi {u} V RMS. Oblicz prąd przewodowy i łączną moc czynną.',f'A balanced star-connected load has a per-phase impedance of {r} + j{x} Ω. The sinusoidal line-to-line voltage is {u} V RMS. Find the line current and total active power.',correct,wrong,
        f'Uf = ULL/√3. I = Uf/|Zf| ≈ {n(i)} A. P = 3I²R ≈ {n(p)} kW. W gwieździe prąd przewodowy jest równy fazowemu.',f'Vphase = VLL/√3. I = Vphase/|Zphase| ≈ {n(i)} A. P = 3I²R ≈ {n(p)} kW. In star, line current equals phase current.','Rozróżnij napięcie międzyfazowe i fazowe.','Distinguish line-to-line voltage from phase voltage.',{'u':u,'r':r,'x':x},{'i':i,'p':p},['ac'])
for k,(p,a,b) in enumerate([(10,.8,.95),(20,.75,.95),(15,.85,.98)],1):
    q=p*(math.tan(math.acos(a))-math.tan(math.acos(b)))
    correct=f'{n(q)} kvar'
    wrong=[f'{n(p*math.tan(math.acos(a)))} kvar',f'{n(p*math.tan(math.acos(b)))} kvar',f'{n(p*(b-a))} kvar']
    add('compensation',k,'Kompensacja mocy biernej','Reactive power compensation',f'Odbiornik sinusoidalny pobiera P = {p} kW przy cosφ = {a}, indukcyjnie. Jaką moc bierną pojemnościową powinna dostarczyć idealna bateria kondensatorów, aby uzyskać cosφ = {b}, przy niezmienionej P i napięciu?',f'A sinusoidal load draws P = {p} kW at lagging cosφ = {a}. What capacitive reactive power must an ideal capacitor bank supply to reach cosφ = {b}, with P and voltage unchanged?',correct,wrong,
        f'Qc = P[tan(arccos({a})) − tan(arccos({b}))] ≈ {n(q)} kvar. Jest to wartość mocy dostarczanej przez kondensatory; nie całkowita moc bierna odbiornika przed kompensacją.',f'Qc = P[tan(arccos({a})) − tan(arccos({b}))] ≈ {n(q)} kvar. This is the capacitor bank contribution, not the original load reactive power.','Porównaj moc bierną przed kompensacją i po niej: Q = P tanφ.','Compare reactive power before and after compensation: Q = P tanφ.',{'p':p,'a':a,'b':b},{'q':q},['ac'])
for k,(u,i1,i3) in enumerate([(230,10,5),(230,8,6),(120,12,9)],1):
    p=u*i1; irms=math.hypot(i1,i3); pf=i1/irms
    correct=f'P = {n(p)} W; PF ≈ {n(pf,3)}'
    wrong=[f'P = {n(u*irms)} W; PF = 1',f'P = {n(p)} W; PF = 1',f'P = {n(u*(i1+i3))} W; PF ≈ {n(i1/(i1+i3),3)}']
    add('harmonics',k,'Harmoniczne i współczynnik mocy','Harmonics and power factor',f'Napięcie ma wyłącznie sinusoidalną składową podstawową {u} V RMS. Prąd zawiera tylko składową podstawową {i1} A RMS w fazie z napięciem i trzecią harmoniczną {i3} A RMS. Oblicz P i całkowity PF = P/(U RMS · I RMS).',f'The voltage consists solely of a sinusoidal fundamental of {u} V RMS. Current contains only a fundamental of {i1} A RMS in phase with voltage and a third harmonic of {i3} A RMS. Find P and total PF = P/(V RMS · I RMS).',correct,wrong,
        f'I RMS = √(I₁² + I₃²) ≈ {n(irms)} A. Przy czysto sinusoidalnym napięciu trzecia harmoniczna prądu nie wnosi średniej mocy czynnej: P = UI₁ = {n(p)} W. PF = I₁/I RMS ≈ {n(pf,3)}; cosφ₁ = 1 nie oznacza PF = 1.',f'I RMS = √(I₁² + I₃²) ≈ {n(irms)} A. With purely sinusoidal voltage, the third current harmonic contributes no average active power: P = VI₁ = {n(p)} W. PF = I₁/I RMS ≈ {n(pf,3)}; cosφ₁ = 1 does not imply PF = 1.','Składowe różnych harmonicznych sumują się kwadratowo w wartości RMS.','Different harmonic components add in quadrature for RMS.',{'u':u,'i1':i1,'i3':i3},{'p':p,'irms':irms,'pf':pf},['ac'])
for k,(freq,poles,speed) in enumerate([(50,4,1440),(50,6,960),(60,4,1746)],1):
    ns=120*freq/poles; s=(ns-speed)/ns; fr=s*freq
    correct=f's = {n(s*100)}%; f₂ = {n(fr)} Hz'
    wrong=[f's = {n(s*100)}%; f₂ = {freq} Hz',f's = {n((1-s)*100)}%; f₂ = {n((1-s)*freq)} Hz',f's = {n(s*100/2)}%; f₂ = {n(fr/2)} Hz']
    add('slip',k,'Poślizg silnika','Motor slip',f'Silnik indukcyjny: liczba biegunów {poles}, zasilanie {freq} Hz i prędkość wirnika {speed} obr./min. Jakie są poślizg i częstotliwość prądów wirnika?',f'An induction motor has {poles} poles, a {freq} Hz supply and a rotor speed of {speed} rpm. What are the slip and rotor-current frequency?',correct,wrong,
        f'ns = 120f/liczba biegunów = {n(ns)} obr./min. s = (ns − n)/ns = {n(s*100)}%. f₂ = sf = {n(fr)} Hz.',f'ns = 120f/number of poles = {n(ns)} rpm. s = (ns − n)/ns = {n(s*100)}%. f₂ = sf = {n(fr)} Hz.','Liczba biegunów to dwukrotność liczby par biegunów.','The number of poles is twice the number of pole pairs.',{'freq':freq,'poles':poles,'speed':speed},{'ns':ns,'s':s,'fr':fr},['machines'])
for k,(p,s) in enumerate([(20,.03),(30,.04),(15,.05)],1):
    loss=p*s*1000; mech=p*(1-s)
    correct=f'ΔPcu₂ = {n(loss)} W; Pmech = {n(mech)} kW'
    wrong=[f'ΔPcu₂ = {n(loss)} W; Pmech = {n(p)} kW',f'ΔPcu₂ = {n(loss*3)} W; Pmech = {n(p-loss*3/1000)} kW',f'ΔPcu₂ = {n(mech*1000)} W; Pmech = {n(p*s)} kW']
    add('motorpower',k,'Bilans mocy silnika','Motor power balance',f'W uproszczonym modelu silnika indukcyjnego łączna moc przekazana przez szczelinę wynosi {p} kW, a poślizg {n(s*100)}%. Oblicz straty miedziane wirnika i moc mechaniczną rozwijaną wewnętrznie, przed stratami mechanicznymi. Pomijamy dodatkowe straty wirnika.',f'In a simplified induction-motor model, total air-gap power is {p} kW and slip is {n(s*100)}%. Find rotor copper losses and internally developed mechanical power before mechanical losses. Additional rotor losses are neglected.',correct,wrong,
        f'ΔPcu₂ = sPδ = {n(loss)} W. Pmech = (1 − s)Pδ = {n(mech)} kW. Moc na wale jest jeszcze mniejsza o straty mechaniczne.',f'ΔPcu₂ = sPgap = {n(loss)} W. Pmech = (1 − s)Pgap = {n(mech)} kW. Shaft power is further reduced by mechanical losses.','Poślizg wyznacza udział strat miedzianych wirnika w mocy szczeliny.','Slip gives the rotor-copper-loss fraction of air-gap power.',{'p':p,'s':s},{'loss':loss,'mech':mech},['machines'])
for k,(fe,cu) in enumerate([(100,400),(90,250),(80,500)],1):
    load=math.sqrt(fe/cu)
    # Option labels are language-independent percentages; avoid mixed PL/EN in UI.
    correct=f'{n(load*100)}%'; wrong=[f'{n(fe/cu*100)}%',f'{n(load*150)}%','100%']
    add('transformer',k,'Sprawność transformatora','Transformer efficiency',f'Transformator ma stałe straty w rdzeniu {fe} W i straty miedziane {cu} W przy prądzie znamionowym. Przy stałym napięciu, częstotliwości i cosφ, pomijając inne straty i spadek napięcia, przy jakim procencie obciążenia znamionowego sprawność jest największa?',f'A transformer has constant core losses of {fe} W and copper losses of {cu} W at rated current. With fixed voltage, frequency and cosφ, neglecting other losses and voltage drop, at what percentage of rated load is efficiency highest?',correct,wrong,
        f'Przy względnym obciążeniu x straty miedziane wynoszą x²Pcu,n. Maksimum sprawności wypada przy x²Pcu,n = Pfe, więc x = √({fe}/{cu}) = {n(load*100)}%.',f'At relative load x, copper losses are x²Pcu,rated. Maximum efficiency occurs at x²Pcu,rated = Pcore, so x = √({fe}/{cu}) = {n(load*100)}%.','Straty miedziane rosną z kwadratem prądu, a straty rdzenia przyjmujemy stałe.','Copper losses grow with current squared; core losses are assumed constant.',{'fe':fe,'cu':cu},{'load':load},['ac'])
for k,(vin,vout,freq,l) in enumerate([(48,12,100000,100e-6),(24,12,100000,100e-6),(48,24,200000,100e-6)],1):
    d=vout/vin; ripple=(vin-vout)*d/(l*freq)
    correct=f'D = {n(d*100)}%; ΔIL = {n(ripple)} A'
    wrong=[f'D = {n(d*50)}%; ΔIL = {n(ripple)} A',f'D = {n(d*100)}%; ΔIL = {n(ripple/2)} A',f'D = {n(d*100)}%; ΔIL = {n(ripple*2)} A']
    add('buck',k,'Przetwornice DC/DC','DC/DC converters',f'Idealny buck w stanie ustalonym i trybie ciągłego prądu dławika przetwarza {vin} V na {vout} V. Częstotliwość przełączania: {n(freq/1000)} kHz, L = {n(l*1e6)} µH. Pomijamy tętnienia napięcia wyjściowego. Oblicz wypełnienie D i tętnienia prądu dławika od minimum do maksimum.',f'An ideal buck in steady-state continuous conduction converts {vin} V to {vout} V. Switching frequency: {n(freq/1000)} kHz; L = {n(l*1e6)} µH. Output-voltage ripple is neglected. Find duty cycle D and peak-to-peak inductor-current ripple.',correct,wrong,
        f'D = Uout/Uin = {n(d*100)}%. ΔIL = (Uin − Uout)D/(Lfs) = {n(ripple)} A peak-to-peak. To nie wartość RMS ani amplituda połowy tętnień.',f'D = Vout/Vin = {n(d*100)}%. ΔIL = (Vin − Vout)D/(Lfs) = {n(ripple)} A peak-to-peak. This is neither RMS nor half the ripple excursion.','W czasie włączenia klucza napięcie dławika wynosi Uin − Uout; di/dt = UL/L.','While the switch is on, inductor voltage is Vin − Vout; di/dt = VL/L.',{'vin':vin,'vout':vout,'freq':freq,'l':l},{'d':d,'ripple':ripple},['buck'])
for k,(r,x) in enumerate([(4,3),(10,-5),(6,8)],1):
    def z(rr,xx): return f'{rr} {"+" if xx>=0 else "−"} j{abs(xx)} Ω'
    add('matching',k,'Dopasowanie impedancji','Impedance matching',f'Liniowe źródło Thévenina ma impedancję {z(r,x)} przy ustalonej częstotliwości. Można dowolnie dobierać dodatnią rezystancję oraz reaktancję obciążenia. Jakie ZL zapewni największą moc czynną w obciążeniu?',f'A linear Thévenin source has impedance {z(r,x)} at a fixed frequency. Both positive load resistance and load reactance may be freely chosen. Which ZL maximizes active power delivered to the load?',z(r,-x),[z(r,x),f'{n(math.hypot(r,x))} Ω',z(2*r,-x)],
        f'Najpierw znosimy reaktancję źródła: XL = −XTh. Następnie maksimum P wypada przy RL = RTh. ZL = sprzężenie ZTh = {z(r,-x)}. Dla obciążenia wyłącznie rezystancyjnego warunek byłby inny: RL = |ZTh|.',f'First cancel source reactance: XL = −XTh. Then P is maximized at RL = RTh. ZL is the complex conjugate of ZTh: {z(r,-x)}. A purely resistive load would instead require RL = |ZTh|.','Rozróżnij dowolne obciążenie zespolone od obciążenia wyłącznie rezystancyjnego.','Distinguish an unrestricted complex load from a purely resistive one.',{'r':r,'x':x},{'r':r,'x':-x},['ac'])
for question in questions:
    source = {'threephase':'threephase','harmonics':'pf','transformer':'transformer','matching':'matching'}.get(question['group'])
    if source: question['sourceIds'] = [source]

package={'manifest':{'id':'ELECTRICITY-STUDENT','version':'1.0.0','title':'Wiedza z zakresu elektryczności','created':'2026-10-05','mode':'knowledge','languages':['pl','en'],'questionCount':30,'level':'Third-year electrical engineering; author-selected scope, not an official examination'},'settings':{'questionCountByDifficulty':{'1':10},'onePerGroup':True},'sources':SOURCES,'questions':questions}
assert len(questions)==30
raw=(json.dumps(package,ensure_ascii=False,indent=2)+'\n').encode()
(ROOT/'topics/electricity-student.json').write_bytes(raw)
packed=gzip.compress(raw,mtime=0)
(ROOT/'topics/electricity-student.quiz.gz').write_bytes(packed)
encoded=base64.b64encode(packed).decode()
(ROOT/'topics/electricity-student.quiz.gz.js').write_text("window.KNJ_EMBEDDED_TOPICS = window.KNJ_EMBEDDED_TOPICS || {};\nwindow.KNJ_EMBEDDED_TOPICS['topics/electricity-student.quiz.gz'] = '"+encoded+"';\n")
print(f'Built {len(questions)} bilingual questions; {len(packed)} gzip bytes.')
