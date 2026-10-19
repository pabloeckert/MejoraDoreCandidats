# Dore Candidate Compass

https://github.com/pabloeckert/MejoraFlashArtifacts
Reviza y Analiza propuesta y propon mejoras, analiza contexto y requerimieto 
Vamos a realizar las entrevistas a candidatos para supervisor de Doré Panadería y Cafetería. El cronograma es de 8.30 a 12.00 hs y  de 14.30 hs a 17.00 hs. Paso cronograma de entrevistas. Estaremos 4 evaluadoras: Cecilia, Dahiana, Silvana y Sindy. La idea es que cada una puntúe las respuestas de los entrevistados a cada pregunta que analiza una cuestión clave. Para ello se definieron 5 preguntas clave, las cuales se puntuan de 1 a 3, y la grilla las pondera en base a la importancia de cada uno. Adjunto la guía express con la grilla./skill:mejora-continua-brand 
Crea una aplicación web de una sola página (SPA) responsiva utilizando React, Tailwind CSS y Vite o el entorno estándar de Lovable. La aplicación es una herramienta interna para evaluar candidatos a un puesto de trabajo en tiempo real.1. IDENTIDAD VISUAL Y UI/UXMarca: Doré Panadería y Cafetería.Colores: Usa fondo blanco puro (#FFFFFF). El color de acento principal para headers, botones primarios, bordes activos y barras superiores debe ser Verde Salvia (aproximadamente #83A686).   Tipografía: Utiliza una fuente Serif elegante (como Playfair Display, Merriweather o similar) para el logotipo en texto y los títulos principales. Utiliza una Sans-Serif limpia y legible (como Inter o Roboto) para el cuerpo del texto, las preguntas y los botones.   Estilo: Limpio, minimalista y profesional. Nada de gradientes saturados.2. ARQUITECTURA DE PANTALLASLa app debe tener una navegación superior simple para alternar entre dos vistas:Vista 1: "Cargar Evaluación" (Optimizada para Mobile). Formularios amplios, botones touch-friendly.Vista 2: "Tablero Consolidado" (Optimizada para Desktop/Tablet). Una tabla de resultados en grilla tipo Bento o Data Table estándar.3. DATOS INICIALES (Hardcodeados en el estado para el prototipo)Evaluadoras: Cecilia, Dahiana, Silvana, Sindy.   Candidatos (Turno Mañana): Cerioli Javier, Martinez Gustavo Adrian, Arrua Danila Noemi, Oliveira Juan Pablo, Grecco Marcelo Javier.   Candidatos (Turno Tarde): Ferreyra Márquez Alejandro, Malaquias Victor Fabian, Roa Alexis.   4. VISTA 1: FORMULARIO DE EVALUACIÓNDebe contener:Select de Evaluadora.Select de Candidato.5 preguntas con un selector de escala del 1 al 3 (1 = No cumple, 2 = Cumple, 3 = Supera). Se debe poder seleccionar clickeando/tocando números grandes.   Preguntas y Ponderaciones internas (ocultas en la UI, pero usadas para el cálculo):P1. Manejo de personal (Peso x2).   P2. Contingencias (Máquina rota/Cliente enojado) (Peso x3).   P3. Protocolos y Calidad (Peso x2).   P4. Delimitación de responsabilidad (Peso x3).   P5. Compatibilidad y Motivación (Peso x1).   Botón "Enviar Evaluación" (Verde Salvia). Al enviar, guarda la evaluación en el estado global (o simula guardado en LocalStorage).5. VISTA 2: TABLERO CONSOLIDADO Y LÓGICA DE CÁLCULOUna tabla que muestre a todos los candidatos. Por cada candidato, calcula y muestra:Cuántas evaluaciones recibió (ej. 2 de 4).El Puntaje Final: Se calcula multiplicando el puntaje (1 a 3) de cada pregunta por su peso, y promediando los resultados de todas las evaluadoras que puntuaron a ese candidato. Puntaje máximo posible: 33 puntos.   Estado / Decisión (Reglas estrictas):VETO AUTOMÁTICO: Si en la Pregunta 2 o en la Pregunta 4 CUALQUIER evaluadora le puso un puntaje de "1", el estado es "Veto Automático (Descarte)" y debe resaltarse en color Rojo (#E1061E).   Si el puntaje final es menor a 20: "Descartado".   Si el puntaje final es de 20 a 26: "En Reserva" (Color amarillo/naranja sutil).   Si el puntaje final es de 27 a 33: "Terna Final" (Color Verde Salvia).   6. INSTRUCCIÓN CRÍTICA DE CÓDIGO (Para posterior exportación a Vite/Antigravity)Estructura el proyecto en componentes modulares separados. Crea una carpeta components con EvaluationForm.tsx y Dashboard.tsx. Separa la lógica de cálculo en un archivo utils/scoring.ts y define las interfaces en types.ts. Usa un Context o Zustand para el estado global de las evaluaciones, de modo que al cambiar a la vista Tablero, los datos cargados persistan.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://dore-candidate-compass.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/5a3aa29a-d62d-4a6a-9453-eadab03dd531).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
