"""Append 30 bilingual basic questions to the existing student bank; rerunnable."""
import json,gzip,random
from pathlib import Path
root=Path(__file__).resolve().parents[1];p=root/'topics/electricity-student.json'
bank=json.loads(p.read_text());bank['questions']=[q for q in bank['questions'] if q['difficulty']==1]
sources=[('basic-power','9-5-electrical-energy-and-power'),('basic-circuits','10-2-resistors-in-series-and-parallel'),('basic-kcl','10-3-kirchhoffs-rules'),('basic-charge','9-1-electrical-current'),('basic-capacitance','8-1-capacitors-and-capacitance'),('basic-ac','15-1-ac-sources')]
bank['sources']=[s for s in bank['sources'] if not s['id'].startswith('basic-')]+[{'id':id,'title':'OpenStax University Physics Vol. 2: '+slug,'url':'https://openstax.org/books/university-physics-volume-2/pages/'+slug} for id,slug in sources]
def fmt(x):return f'{x:g}'
for variant in range(1,4):
 u=12*variant;r=6;a=2*variant;b=3*variant;f=25*variant
 rows=[
 ('ohm','Prawo Ohma','Ohm’s law',f'Idealny rezystor {r} Ω podłączono do źródła {u} V DC. Jaki prąd przez niego płynie?',f'An ideal {r} Ω resistor is connected to a {u} V DC source. What current flows?',{'u':u,'r':r},u/r,'A',f'I = U/R = {u}/{r} = {fmt(u/r)} A.','I = U/R.','basic-power'),
 ('series','Połączenie szeregowe','Series connection',f'Rezystory {a} Ω i {b} Ω połączono szeregowo. Ile wynosi ich rezystancja zastępcza?',f'Resistors of {a} Ω and {b} Ω are connected in series. What is their equivalent resistance?',{'a':a,'b':b},a+b,'Ω',f'R = R₁ + R₂ = {a} + {b} = {a+b} Ω.','R = R₁ + R₂.','basic-circuits'),
 ('parallel','Połączenie równoległe','Parallel connection',f'Dwa jednakowe rezystory po {u} Ω połączono równolegle. Ile wynosi rezystancja zastępcza?',f'Two identical {u} Ω resistors are connected in parallel. What is their equivalent resistance?',{'r':u},u/2,'Ω',f'1/R = 1/{u} + 1/{u}; R = {fmt(u/2)} Ω.','1/R = 1/R₁ + 1/R₂.','basic-circuits'),
 ('power','Moc elektryczna','Electrical power',f'Odbiornik zasilany napięciem {u} V DC pobiera stały prąd 2 A. Jaką moc elektryczną pobiera?',f'A load supplied at {u} V DC draws a constant 2 A. What electrical power does it draw?',{'u':u,'i':2},u*2,'W',f'P = UI = {u} × 2 = {u*2} W.','P = UI.','basic-power'),
 ('energy','Energia elektryczna','Electrical energy',f'Odbiornik pobiera stale {variant} kW przez 2 godziny. Ile energii elektrycznej pobierze?',f'A load draws a constant {variant} kW for 2 hours. How much electrical energy does it use?',{'p':variant,'t':2},variant*2,'kWh',f'E = Pt = {variant} × 2 = {variant*2} kWh.','E = Pt.','basic-power'),
 ('kcl','Bilans prądów','Current balance',f'Do węzła wpływają prądy {a} A i {b} A. Wypływa z niego tylko jeden prąd. W stanie ustalonym ile wynosi?',f'Currents of {a} A and {b} A enter a node. Only one current leaves. What is it in steady state?',{'a':a,'b':b},a+b,'A',f'I = I₁ + I₂ = {a} + {b} = {a+b} A.','ΣI = 0.','basic-kcl'),
 ('charge','Ładunek elektryczny','Electric charge',f'Stały prąd {variant} A płynie przez 10 sekund. Jaki ładunek przepłynie przez przekrój przewodu?',f'A constant current of {variant} A flows for 10 seconds. What charge passes through a cross-section of the wire?',{'i':variant,'t':10},variant*10,'C',f'Q = It = {variant} × 10 = {variant*10} C.','Q = It.','basic-charge'),
 ('capacitor','Kondensator','Capacitor',f'Idealny kondensator 100 µF naładowano do {u} V. Jaka jest wartość bezwzględna ładunku jednej okładki?',f'An ideal 100 µF capacitor is charged to {u} V. What is the magnitude of the charge on one plate?',{'c':100,'u':u},u/10,'mC',f'Q = CU = 100 µF × {u} V = {fmt(u/10)} mC.','Q = CU; 1000 µC = 1 mC.','basic-capacitance'),
 ('period','Częstotliwość i okres','Frequency and period',f'Przebieg sinusoidalny ma częstotliwość {f} Hz. Ile wynosi jego okres?',f'A sinusoidal waveform has a frequency of {f} Hz. What is its period?',{'f':f},1000/f,'ms',f'T = 1/f = 1/{f} s ≈ {1000/f:.2f} ms.','T = 1/f; 1 s = 1000 ms.','basic-ac'),
 ('loss','Straty cieplne','Heat losses',f'Przez rezystor {r} Ω płynie stały prąd {variant} A. Jaka moc zmienia się w nim w ciepło?',f'A constant current of {variant} A flows through a {r} Ω resistor. What power is converted to heat?',{'i':variant,'r':r},variant**2*r,'W',f'P = I²R = {variant}² × {r} = {variant**2*r} W.','P = I²R.','basic-power')]
 for group,cat,catEn,pl,en,inputs,value,unit,ex,hint,source in rows:
  label=lambda v:f'{round(v,2):g} {unit}'
  values=[value,value*2,value/2,value*3];correct=f'o{(variant+len(group))%4}'
  labels=[label(v) for v in values];idx=int(correct[1]);labels[0],labels[idx]=labels[idx],labels[0]
  options=[{'id':f'o{i}','label':v} for i,v in enumerate(labels)]
  bank['questions'].append({'id':f'ee-pupil-{group}-{variant}','group':group,'difficulty':0,'category':cat,'text':pl,'options':options,'correctOptionId':correct,'explanation':ex,'hint':hint,'sourceIds':[source],'calculation':{'inputs':inputs,'expected':{'value':value,'unit':unit}},'translations':{'en':{'category':catEn,'text':en,'options':options,'explanation':ex,'hint':hint}}})
bank['manifest'].update(version='1.1.0',questionCount=60,level='Pupil: basic electrical calculations; Student: third-year electrical engineering; author-selected scope')
bank['settings']['questionCountByDifficulty']={'0':10,'1':10}
raw=json.dumps(bank,ensure_ascii=False,indent=2).encode();p.write_bytes(raw+b'\n')
compressed=gzip.compress(raw,mtime=0);p.with_suffix('.quiz.gz').write_bytes(compressed)
import base64
p.with_suffix('.quiz.gz.js').write_text("window.KNJ_EMBEDDED_TOPICS = window.KNJ_EMBEDDED_TOPICS || {};\nwindow.KNJ_EMBEDDED_TOPICS['topics/electricity-student.quiz.gz'] = '"+base64.b64encode(compressed).decode()+"';\n")
print('60 questions: 30 pupil + 30 student; gzip and embedded rebuilt')
