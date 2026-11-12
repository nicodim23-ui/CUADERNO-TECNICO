// Biblioteca de ejercicios de gimnasio, ordenada por patrón de movimiento.
// Nivel: 1 básico, 2 intermedio, 3 avanzado. Dentro de cada grupo van de más simple a más complejo.
// El video y la imagen de cada ejercicio los carga el cuerpo técnico desde la app.

export const LIB_PATTERNS=['Rodilla dominante','Cadera dominante','Empuje','Tracción','Core','Pliometría'];
export const LEVELS={1:'Básico',2:'Intermedio',3:'Avanzado'};

const P=(pattern,group,rows)=>rows.map(([id,name,level,cue])=>({id,pattern,group,name,level,cue}));

export const LIB=[
 ...P('Rodilla dominante','Movilidad previa',[
  ['rd-mov-tobillo','Movilidad de tobillo (rodilla a la pared)',1,'Talón apoyado, la rodilla avanza sobre el segundo dedo del pie.'],
  ['rd-mov-cadera','Movilidad de cadera 90/90',1,'Columna larga, rotar desde la cadera sin ayudarse con las manos.'],
  ['rd-mov-toracica','Movilidad torácica en cuadrupedia',1,'Mano en la nuca, abrir el codo hacia el techo sin mover la cadera.']]),
 ...P('Rodilla dominante','Dos piernas',[
  ['rd-sent-pc','Sentadilla con peso corporal',1,'Pies al ancho de hombros, rodillas en línea con los pies, espalda neutra.'],
  ['rd-sent-goblet','Sentadilla goblet',1,'La carga contra el pecho ayuda a mantener el torso erguido.'],
  ['rd-sent-frontal','Sentadilla frontal',2,'Codos altos y torso vertical. Exige buena movilidad de tobillo y torácica.'],
  ['rd-sent-trasera','Sentadilla trasera',2,'Profundidad que permita mantener la columna neutra. Subir con intención de velocidad.']]),
 ...P('Rodilla dominante','Una pierna',[
  ['rd-split','Zancada estática (split)',1,'Bajar vertical, peso repartido, rodilla de adelante estable.'],
  ['rd-zancada-atras','Zancada hacia atrás',1,'Paso largo hacia atrás, empujar con la pierna de adelante para volver.'],
  ['rd-subida-banco','Subida al banco',2,'Subir empujando solo con la pierna de arriba y bajar frenando.'],
  ['rd-bulgara','Sentadilla búlgara',2,'Pie de atrás elevado, torso apenas inclinado, bajar controlado.'],
  ['rd-lateral','Sentadilla lateral',2,'Cadera hacia atrás sobre la pierna que flexiona, la otra queda extendida.'],
  ['rd-patinador','Sentadilla del patinador',3,'La rodilla de atrás baja hasta rozar el suelo sin apoyar el pie.'],
  ['rd-una-pierna','Sentadilla a una pierna al cajón',3,'Sentarse y levantarse con una sola pierna, sin impulso.']]),

 ...P('Cadera dominante','Dos piernas',[
  ['cd-bisagra','Bisagra de cadera con bastón',1,'Bastón en contacto con nuca, espalda alta y sacro. Llevar la cadera atrás.'],
  ['cd-buenos-dias','Buenos días con banda o disco',1,'Rodillas apenas flexionadas, bajar el torso con la espalda neutra.'],
  ['cd-isquios-maquina','Isquiotibiales en máquina',1,'Bajada lenta de 3 segundos.'],
  ['cd-pm-hexagonal','Peso muerto con barra hexagonal',2,'La carga queda en el centro del cuerpo: es la variante más fácil de aprender.'],
  ['cd-pm','Peso muerto convencional',2,'Barra pegada al cuerpo, espalda neutra, empujar el suelo con los pies.'],
  ['cd-pm-sumo','Peso muerto sumo',2,'Pies anchos y recorrido corto. Buena opción con poca movilidad de cadera.'],
  ['cd-pm-rumano','Peso muerto rumano',2,'Bajar hasta sentir tensión en isquiotibiales sin perder la espalda neutra.'],
  ['cd-hip-thrust','Empuje de cadera (hip thrust)',2,'Mentón al pecho, costillas abajo y pausa de 1 segundo arriba.'],
  ['cd-swing','Balanceo con pesa rusa',2,'Es una bisagra explosiva: la pesa sube por el empuje de la cadera, no de los brazos.']]),
 ...P('Cadera dominante','Una pierna e isquiotibiales',[
  ['cd-pm-una-pierna','Peso muerto rumano a una pierna',2,'Cadera cuadrada al suelo, la pierna libre se alinea con el torso.'],
  ['cd-deslizador','Curl de isquiotibiales con deslizador',2,'Cadera arriba todo el tiempo, extender las piernas lento.'],
  ['cd-curl-pelota','Curl de isquiotibiales con pelota',2,'Mantener el puente mientras se acerca y aleja la pelota.'],
  ['cd-hip-thrust-1','Empuje de cadera a una pierna',3,'Sin rotar la pelvis al subir.'],
  ['cd-nordico','Nórdicos',3,'Cuerpo en bloque de rodillas a cabeza, caer lo más lento posible.']]),

 ...P('Empuje','Horizontal a dos brazos',[
  ['em-flex-pared','Flexiones contra la pared',1,'Cuerpo en plancha, codos cerca del cuerpo, como un pase de pecho.'],
  ['em-flex-elevadas','Flexiones con manos elevadas',1,'Cuanto más bajo el apoyo, más difícil. Mantener la plancha.'],
  ['em-flex-banda','Flexiones asistidas con banda',1,'La banda ayuda en la parte más baja del recorrido.'],
  ['em-flex','Flexiones de brazos',2,'Manos apenas por fuera de los hombros, pecho al suelo, cuerpo en bloque.'],
  ['em-banca','Press de banca con barra',2,'Escápulas juntas, pies firmes, bajar la barra al pecho con control.'],
  ['em-banca-manc','Press de banca con mancuernas',2,'Más trabajo de estabilidad que con barra.'],
  ['em-suelo','Press desde el suelo',2,'Pausa de 1 segundo con los codos apoyados antes de empujar.'],
  ['em-inclinado','Press inclinado',2,'Banco a 30–45 grados.'],
  ['em-flex-lastre','Flexiones con lastre',3,'Disco o chaleco sobre la espalda alta.'],
  ['em-flex-anillas','Flexiones en anillas',3,'La inestabilidad exige más control: empezar con pocas repeticiones.']]),
 ...P('Empuje','Horizontal a un brazo',[
  ['em-banca-1','Press de banca a un brazo con mancuerna',2,'El tronco no rota: la zona media trabaja para sostener.'],
  ['em-banda-1','Empuje a un brazo con banda',2,'De pie o en zancada, sin girar el tronco.'],
  ['em-flex-1','Flexiones a un brazo',3,'Pies bien separados y cadera paralela al suelo.']]),
 ...P('Empuje','Vertical',[
  ['em-press-rodillas','Press de rodillas a un brazo',2,'Una rodilla en el suelo, glúteo apretado, sin arquear la zona lumbar.'],
  ['em-press-1','Press a un brazo de pie',2,'Costillas abajo, el brazo termina al lado de la oreja.'],
  ['em-press','Press estricto',2,'Sin ayuda de las piernas. Abdomen firme y codos extendidos arriba.'],
  ['em-push-press','Press con impulso',3,'Pequeña flexión y extensión rápida de piernas antes de empujar.'],
  ['em-push-jerk','Segundo tiempo de potencia',3,'Impulso de piernas y recepción con las rodillas flexionadas.']]),

 ...P('Tracción','Vertical',[
  ['tr-sosten','Sostén arriba de la barra',1,'Mantener el mentón por encima de la barra sin balancearse.'],
  ['tr-dom-banda','Dominadas con banda',1,'Recorrido completo, desde los brazos extendidos.'],
  ['tr-dom-negativa','Dominadas con salto y bajada lenta',2,'Subir con un salto y bajar en 3 a 6 segundos.'],
  ['tr-dom-neutro','Dominadas con agarre neutro',2,'Palmas enfrentadas: es el agarre más amable para el hombro.'],
  ['tr-dom-supino','Dominadas con agarre supino',2,'Palmas hacia la cara: más trabajo de bíceps.'],
  ['tr-dom-prono','Dominadas con agarre prono',3,'Palmas hacia adelante, mentón por encima de la barra.'],
  ['tr-dom-lastre','Dominadas con lastre',3,'Solo con buena técnica y varias repeticiones limpias sin carga.']]),
 ...P('Tracción','Horizontal a dos brazos',[
  ['tr-remo-invertido','Remo invertido',1,'Cuerpo en bloque. Cuanto más horizontal el cuerpo, más difícil.'],
  ['tr-remo-polea','Remo con polea o banda',1,'Hombros lejos de las orejas, llevar los codos hacia atrás.'],
  ['tr-remo-banco','Remo acostado en banco',2,'Pecho apoyado todo el tiempo, llevar la carga hacia el abdomen.'],
  ['tr-remo-barra','Remo inclinado con barra',2,'Bisagra de cadera sostenida y columna neutra.']]),
 ...P('Tracción','Horizontal a un brazo',[
  ['tr-remo-1','Remo a un brazo con mancuerna',1,'Apoyo en banco, espalda neutra, sin rotar el tronco.'],
  ['tr-renegade','Remo en plancha',3,'Plancha con mancuernas: remar sin que la cadera gire.'],
  ['tr-remo-inv-1','Remo invertido a un brazo',3,'Exige mucha fuerza y control de la zona media.']]),

 ...P('Core','Anti-extensión',[
  ['co-curl-up','Curl-up',1,'Una pierna flexionada, manos bajo la zona lumbar, despegar apenas los hombros.'],
  ['co-plancha','Plancha frontal',1,'Línea recta de cabeza a talones, glúteos y abdomen apretados.'],
  ['co-plancha-elevada','Plancha frontal con torso elevado',1,'Antebrazos sobre un banco: versión de inicio.'],
  ['co-bicho-muerto','Bicho muerto',1,'Zona lumbar pegada al suelo mientras se extienden brazo y pierna opuestos.'],
  ['co-rollout-pelota','Rollout con pelota',2,'Alejar la pelota sin que la cadera caiga.'],
  ['co-sierra','Sierra en plancha',2,'Desde la plancha, mover el cuerpo adelante y atrás sobre los antebrazos.'],
  ['co-rollout-rueda','Rollout con rueda',3,'Recorrido que permita mantener la zona lumbar neutra.']]),
 ...P('Core','Anti-rotación',[
  ['co-pallof','Press Pallof',1,'De costado a la banda, extender los brazos sin dejar que el tronco gire.'],
  ['co-plancha-brazo','Plancha estirando un brazo',1,'Pies separados, la cadera no se mueve al despegar la mano.'],
  ['co-reloj','Reloj en plancha',2,'Desde la plancha alta, llevar una mano a distintas horas del reloj.'],
  ['co-landmine','Rotación con barra anclada',2,'Brazos extendidos, mover la barra de lado a lado con la cadera fija.']]),
 ...P('Core','Anti-flexión lateral',[
  ['co-lateral-corta','Plancha lateral con rodillas apoyadas',1,'Cadera adelante, línea recta de rodillas a cabeza.'],
  ['co-lateral','Plancha lateral',2,'Apoyo en antebrazo y pies, cadera alta.'],
  ['co-granjero','Caminata de granjero',2,'Una carga en cada mano, caminar erguido sin balancearse.'],
  ['co-maleta','Caminata con carga de un solo lado',2,'El tronco no se inclina hacia la carga.'],
  ['co-lenador','Leñador con polea o banda',2,'Diagonal de arriba hacia abajo, en línea, en zancada o de pie.'],
  ['co-estrella','Plancha estrella',3,'Plancha lateral con brazo y pierna de arriba elevados.'],
  ['co-remo-lateral','Remo en plancha lateral',3,'Sostener la plancha lateral mientras se rema con la banda.']]),
 ...P('Core','Glúteos y estabilidad de cadera',[
  ['co-cook','Levantamiento de cadera con rodilla al pecho',1,'Una rodilla abrazada al pecho, subir la cadera con la otra pierna.'],
  ['co-puente','Puente de glúteo a dos piernas',1,'Empujar con los talones y apretar glúteos arriba.'],
  ['co-perro','Perro de caza',1,'En cuadrupedia, extender brazo y pierna opuestos sin mover la espalda.'],
  ['co-almeja','Almeja con banda',1,'De costado, abrir la rodilla de arriba sin rotar la pelvis.'],
  ['co-caminata-banda','Caminata lateral con banda',1,'Semiflexión, pasos cortos, rodillas hacia afuera.'],
  ['co-puente-1','Puente de glúteo a una pierna',2,'Pelvis nivelada al subir.']]),
 ...P('Core','Levantamiento turco',[
  ['co-turco-tronco','Elevación de tronco con pesa',1,'Primer cuarto del levantamiento: de acostado a apoyo en el codo.'],
  ['co-turco-medio','Medio levantamiento turco',2,'Hasta el puente con la mano apoyada, mirando la pesa.'],
  ['co-turco','Levantamiento turco completo',3,'Lento y por pasos, el brazo de la pesa siempre vertical.']]),

 ...P('Pliometría','Aterrizajes',[
  ['pl-aterrizaje','Aterrizaje desde cajón bajo',1,'Caer con las dos piernas, suave y en silencio, rodillas alineadas.'],
  ['pl-aterrizaje-lat','Aterrizaje lateral',1,'Salto corto al costado y freno estable sobre la pierna de afuera.'],
  ['pl-aterrizaje-1','Aterrizaje a una pierna',2,'Sostener 2 segundos al caer, sin que la rodilla se vaya hacia adentro.']]),
 ...P('Pliometría','Saltos a dos piernas',[
  ['pl-pogos','Rebotes de tobillo (pogos)',1,'Rodillas casi extendidas, contacto corto y elástico.'],
  ['pl-cmj','Salto con contramovimiento',1,'Bajar rápido y saltar lo más alto posible.'],
  ['pl-cajon','Salto al cajón',1,'Subir al cajón saltando y bajar caminando.'],
  ['pl-sent-salto','Sentadilla con salto',2,'Con peso corporal o carga liviana, máxima altura en cada salto.'],
  ['pl-horizontal','Salto horizontal',2,'Salto en largo sin carrera y aterrizaje firme.'],
  ['pl-vallas','Saltos repetidos sobre vallas bajas',2,'Contactos cortos, sin pausa entre saltos.']]),
 ...P('Pliometría','Una pierna y multisaltos',[
  ['pl-hop','Salto a una pierna con caída en la misma',2,'Hacia adelante, frenando bien cada caída antes de encadenar.'],
  ['pl-hop-lat','Saltos laterales a una pierna',2,'De lado a lado, como un patinador.'],
  ['pl-multisaltos','Multisaltos alternados',3,'Zancadas saltadas largas, de una pierna a la otra.']]),
 ...P('Pliometría','Con caída',[
  ['pl-drop','Salto con caída desde 30 cm',3,'Dejarse caer y rebotar con el menor tiempo de contacto posible.'],
  ['pl-profundidad','Salto en profundidad',3,'Caída más alta y salto máximo. Solo con buena base de fuerza.']])
];
