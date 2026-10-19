# Doré — Evaluación de Supervisores (miércoles 21/10)

## Análisis de la propuesta

La propuesta está bien pensada (5 preguntas, pesos, veto). Encontré 4 puntos para corregir antes de las entrevistas:

1. **Datos compartidos (crítico).** Con LocalStorage, cada evaluadora ve solo lo que cargó en su propio celular, y el tablero nunca junta las 4 notas. Propuesta: guardar en Lovable Cloud (sin login, acceso con un PIN del equipo) para que el tablero se arme solo y en vivo desde cualquier dispositivo. Si en algún momento no hay internet, se guarda en el celular y se envía cuando vuelve la conexión.
2. **Rangos que no cubren todo.** El promedio puede salir con decimales (ej. 26,5), que hoy no cae en ningún rango. Reglas claras: menor a 20 = Descartado; de 20 a menos de 27 = En Reserva; 27 o más = Terna Final. El veto siempre tiene prioridad.
3. **Notas duplicadas.** Si una evaluadora vuelve a cargar al mismo candidato, se reemplaza su nota anterior (con aviso) en lugar de contarse dos veces. También podrá editarla.
4. **Resultado provisorio.** Mientras falten evaluadoras (ej. 2 de 4), el estado se marca como "Provisorio".

## Mejoras sugeridas (incluidas)

- Candidatos ordenados por turno y horario del cronograma, con el que corresponde según la hora resaltado.
- En el formulario, cada pregunta muestra el texto que se le hace al candidato y una guía corta de qué significa 1, 2 y 3 (sacada de la Guía Express), desplegable para no ocupar lugar.
- Campo opcional de comentarios por evaluadora.
- En el tablero: detalle por candidato (nota de cada evaluadora por pregunta), orden por puntaje y botón para descargar los resultados en planilla (CSV).
- La evaluadora elegida queda recordada en su celular para no elegirla cada vez.

## Diseño

- Fondo blanco, verde salvia (#83A686) para encabezado, botones y selección; rojo #E1061E solo para el veto; ámbar suave para "En Reserva".
- Títulos en Playfair Display, texto en Inter.
- Vista "Cargar Evaluación": pensada para celular, botones 1-2-3 grandes.
- Vista "Tablero Consolidado": tabla para notebook/tablet, con tarjetas en celular.

## Detalles técnicos

- Estructura: `src/types.ts`, `src/utils/scoring.ts`, `src/components/EvaluationForm.tsx`, `src/components/Dashboard.tsx`, store global con Zustand; ruta `/` con dos pestañas.
- Pesos P1 x2, P2 x3, P3 x2, P4 x3, P5 x1 (máx. 33). Puntaje = promedio de las sumas ponderadas. Veto si cualquier evaluadora puso 1 en P2 o P4.
- Lovable Cloud: tabla `evaluations` (evaluator, candidate, p1..p5, comment, timestamps) con clave única evaluadora+candidato (upsert), actualización en vivo vía realtime; acceso por PIN validado en el servidor.
- Tests de `scoring.ts`: pesos, máximo 33, veto P2/P4, límites 19,9 / 20 / 26,9 / 27.
- Títulos y descripciones de página propios de Doré.
