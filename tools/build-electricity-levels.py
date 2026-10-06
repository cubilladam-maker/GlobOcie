"""Build three authored difficulty bands without discarding original questions."""
import base64, gzip, json
from pathlib import Path
p=Path(__file__).resolve().parents[1]/'topics/electricity-student.json'
bank=json.loads(p.read_text())
bank['questions']=[q for q in bank['questions'] if '-school-' not in q['id']]
for q in bank['questions']:
    if q['id'].startswith('ee-pupil-'): q['difficulty']=0
    else: q['difficulty']=2
sources={s['id']:s for s in bank['sources']}
chapters={'school-circuits':'10-2-resistors-in-series-and-parallel','school-power':'9-5-electrical-energy-and-power','school-capacitor':'8-3-energy-stored-in-a-capacitor','school-ac':'15-2-simple-ac-circuits'}
for key,slug in chapters.items(): sources[key]={'id':key,'title':'OpenStax University Physics Volume 2: '+slug,'url':'https://openstax.org/books/university-physics-volume-2/pages/'+slug}
bank['sources']=list(sources.values())
for n in range(1,4):
    u=12*n; a=4*n; b=8*n
    rows=[
      ('divider','Dzielnik napięcia','Voltage divider',f'Rezystory {a} Ω i {b} Ω tworzą nieobciążony dzielnik zasilany napięciem {u} V DC. Jakie napięcie występuje na rezystorze {b} Ω?',f'Resistors of {a} Ω and {b} Ω form an unloaded voltage divider supplied at {u} V DC. What is the voltage across the {b} Ω resistor?',{'u':u,'a':a,'b':b},u*b/(a+b),'V','U₂ = U R₂/(R₁ + R₂).','school-circuits'),
      ('parallel-unequal','Rezystancja zastępcza','Equivalent resistance',f'Rezystory {a} Ω i {b} Ω połączono równolegle. Oblicz rezystancję zastępczą.',f'Resistors of {a} Ω and {b} Ω are connected in parallel. Calculate their equivalent resistance.',{'a':a,'b':b},a*b/(a+b),'Ω','R = R₁R₂/(R₁ + R₂).','school-circuits'),
      ('series-power','Moc w obwodzie szeregowym','Power in a series circuit',f'Rezystory {a} Ω i {b} Ω połączono szeregowo do {u} V DC. Jaka moc wydziela się tylko w rezystorze {a} Ω?',f'Resistors of {a} Ω and {b} Ω are connected in series across {u} V DC. What power is dissipated only in the {a} Ω resistor?',{'u':u,'a':a,'b':b},(u/(a+b))**2*a,'W','I = U/(R₁ + R₂); P₁ = I²R₁.','school-power'),
      ('voltage-loss','Spadek napięcia','Voltage drop',f'Całkowita rezystancja pary przewodów wynosi {n/10:g} Ω. Prąd DC wynosi 5 A. Jaki jest spadek napięcia na obu przewodach łącznie?',f'The total resistance of a pair of wires is {n/10:g} Ω. The DC current is 5 A. What is the combined voltage drop across both wires?',{'r':n/10,'i':5},n/2,'V','ΔU = IR.','school-power'),
      ('efficiency','Sprawność','Efficiency',f'Przetwornik pobiera {100*n} W i oddaje {80*n} W mocy użytecznej. Ile wynosi jego sprawność?',f'A converter takes {100*n} W of input power and delivers {80*n} W of useful output power. What is its efficiency?',{'pin':100*n,'pout':80*n},80,'%','η = Pout/Pin × 100%.','school-power'),
      ('energy-joule','Energia w dżulach','Energy in joules',f'Rezystor zasilany napięciem {u} V DC pobiera 2 A przez 60 sekund. Ile energii zamienia w ciepło?',f'A resistor supplied at {u} V DC draws 2 A for 60 seconds. How much energy does it convert to heat?',{'u':u,'i':2,'t':60},u*2*60,'J','E = UIt.','school-power'),
      ('cap-energy','Energia kondensatora','Capacitor energy',f'Idealny kondensator o pojemności 1000 µF naładowano do {u} V. Ile energii zgromadził?',f'An ideal 1000 µF capacitor is charged to {u} V. How much energy does it store?',{'c':.001,'u':u},.5*.001*u*u,'J','E = ½CU²; C in F.','school-capacitor'),
      ('rms','Wartość skuteczna','RMS voltage',f'Napięcie sinusoidalne ma amplitudę {100*n} V. Jaka jest jego wartość skuteczna (RMS)?',f'A sinusoidal voltage has a peak amplitude of {100*n} V. What is its RMS value?',{'peak':100*n},100*n/2**.5,'V','U_RMS = U_peak/√2.','school-ac'),
      ('resistor-ac','Moc rezystora w AC','Resistor power in AC',f'Idealny rezystor 100 Ω zasilany jest napięciem sinusoidalnym {10*n} V RMS. Jaka jest średnia moc?',f'An ideal 100 Ω resistor is supplied with a sinusoidal voltage of {10*n} V RMS. What is the average power?',{'u':10*n,'r':100},n*n,'W','P = U_RMS²/R.','school-ac'),
      ('current-split','Podział prądu','Current division',f'Rezystory {a} Ω i {b} Ω są połączone równolegle. Prąd całkowity wynosi 3 A. Ile płynie przez rezystor {a} Ω?',f'Resistors of {a} Ω and {b} Ω are connected in parallel. The total current is 3 A. How much flows through the {a} Ω resistor?',{'a':a,'b':b,'i':3},2,'A','I₁ = I R₂/(R₁ + R₂).','school-circuits')]
    for group,cat,cat_en,pl,en,inputs,value,unit,hint,source in rows:
        values=[value,value*2,value/2,value*3]
        labels=[f'{v:.3f}'.rstrip('0').rstrip('.')+' '+unit for v in values]
        idx=(n+len(group))%4;labels[0],labels[idx]=labels[idx],labels[0]
        options=[{'id':f'o{i}','label':label} for i,label in enumerate(labels)]
        ex=hint+f' → {value:.3f}'.rstrip('0').rstrip('.')+' '+unit
        pl_hint=hint.replace('C in F.','C w faradach.');pl_ex=ex.replace('C in F.','C w faradach.')
        bank['questions'].append({'id':f'ee-school-{group}-{n}','group':group,'difficulty':1,'category':cat,'text':pl,'options':options,'correctOptionId':f'o{idx}','explanation':pl_ex,'hint':pl_hint,'sourceIds':[source],'calculation':{'inputs':inputs,'expected':{'value':value,'unit':unit}},'translations':{'en':{'category':cat_en,'text':en,'options':options,'explanation':ex,'hint':hint}}})
bank['manifest'].update(version='1.2.0',questionCount=90,level='Primary-school graduate / upper-secondary-school graduate / bachelor or engineering graduate; authored exercise scope, not a certified exam')
bank['settings']['questionCountByDifficulty']={'0':10,'1':10,'2':10}
raw=(json.dumps(bank,ensure_ascii=False,indent=2)+'\n').encode()
p.write_bytes(raw);compressed=gzip.compress(raw,mtime=0);p.with_suffix('.quiz.gz').write_bytes(compressed)
p.with_suffix('.quiz.gz.js').write_text("window.KNJ_EMBEDDED_TOPICS = window.KNJ_EMBEDDED_TOPICS || {};\nwindow.KNJ_EMBEDDED_TOPICS['topics/electricity-student.quiz.gz'] = '"+base64.b64encode(compressed).decode()+"';\n")
print('90 bilingual questions, three bands, ten groups per band')
