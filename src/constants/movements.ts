import { Movement } from '../types';

/**
 * Biblioteca de movimientos.
 * Duraciones y pasos revisados contra guías públicas (AAOS 2022 para
 * deslizamientos tendinosos, regla 20-20-20, NHS para cuello, protocolo
 * de 4 rondas para respiración cuadrada). Los pasos son fijos para que
 * el usuario siempre reciba instrucciones seguras y consistentes.
 */
export const MOVEMENT_LIBRARY: Movement[] = [
  {
    id: 'neck-1',
    title: 'Cervical Reset',
    description: 'Gentle neck rotations and side stretches for screen posture.',
    duration: '2m',
    durationSeconds: 120,
    icon: 'rotate_left',
    category: 'Spine',
    recommended: true,
    neuroBenefit: 'Reduces neck stiffness from sustained screen posture.',
    intensity: 'Low',
    why: {
      es: 'Mantener la cabeza fija frente a la pantalla durante horas rigidiza los músculos del cuello. Movilizarlo de forma suave y dentro de un rango cómodo ayuda a reducir esa rigidez y la tensión acumulada.',
      en: 'Holding your head still in front of a screen for hours stiffens the neck muscles. Moving it gently within a comfortable range helps reduce that stiffness and built-up tension.'
    },
    steps: {
      es: [
        'Siéntate erguido con los pies apoyados y lleva suavemente el mentón hacia atrás, sin inclinar la cabeza.',
        'Gira la cabeza despacio hacia la derecha hasta donde sea cómodo, vuelve al centro y repite hacia la izquierda. Haz 10 giros por lado.',
        'Inclina la oreja hacia el hombro derecho sin subir el hombro y mantén 15–20 segundos. Repite hacia el lado izquierdo.',
        'No hagas círculos completos ni lleves la cabeza hacia atrás. Detente si sientes mareo, dolor u hormigueo en los brazos.'
      ],
      en: [
        'Sit tall with your feet flat and gently draw your chin back without tilting your head.',
        'Slowly turn your head to the right as far as is comfortable, return to center and repeat to the left. Do 10 turns per side.',
        'Tilt your ear toward your right shoulder without lifting the shoulder and hold for 15–20 seconds. Repeat on the left side.',
        'Do not make full circles or tip your head back. Stop if you feel dizzy, pain or tingling in your arms.'
      ]
    }
  },
  {
    id: 'eye-1',
    title: '20-20-20 Relief',
    description: 'Focus reset for digital eye strain.',
    duration: '1m',
    durationSeconds: 60,
    icon: 'visibility',
    category: 'Eyes',
    neuroBenefit: 'Relaxes near-focus effort and reduces digital eye strain.',
    intensity: 'Low',
    why: {
      es: 'Enfocar de cerca durante mucho tiempo mantiene activo el esfuerzo de enfoque del ojo y reduce el parpadeo. Mirar a lo lejos relaja ese esfuerzo y parpadear ayuda a aliviar la sequedad y el cansancio visual.',
      en: 'Focusing up close for a long time keeps the eye working to focus and reduces blinking. Looking far away relaxes that effort, and blinking helps relieve dryness and visual fatigue.'
    },
    steps: {
      es: [
        'Aparta la vista de la pantalla y busca un punto a unos 6 metros (20 pies), como una ventana o el fondo de la sala.',
        'Mantén la mirada en ese punto durante 20 segundos con los ojos relajados.',
        'Parpadea despacio y por completo 10 veces.',
        'Vuelve a mirar a lo lejos otros 20 segundos. Lo ideal es repetir esta pausa cada 20 minutos de pantalla.'
      ],
      en: [
        'Look away from the screen and find a point about 6 meters (20 feet) away, such as a window or the far end of the room.',
        'Keep your gaze on that point for 20 seconds with relaxed eyes.',
        'Blink slowly and fully 10 times.',
        'Look far away for another 20 seconds. Ideally, repeat this break every 20 minutes of screen time.'
      ]
    }
  },
  {
    id: 'spine-1',
    title: 'Thoracic Bridge',
    description: 'Seated upper-back extension over the chair backrest.',
    duration: '2m',
    durationSeconds: 120,
    icon: 'accessibility',
    category: 'Spine',
    recommended: true,
    neuroBenefit: 'Counters the hunched posture of long screen sessions.',
    intensity: 'Medium',
    why: {
      es: 'Pasar horas inclinado hacia la pantalla redondea la espalda alta. Extenderla de forma controlada contrarresta esa postura y ayuda a abrir el pecho y los hombros.',
      en: 'Hours spent leaning toward the screen round the upper back. Extending it in a controlled way counters that posture and helps open the chest and shoulders.'
    },
    steps: {
      es: [
        'Siéntate al fondo de una silla estable con respaldo firme. Si tiene ruedas, frénala o apóyala contra el escritorio.',
        'Entrelaza las manos detrás de la nuca con los codos hacia adelante.',
        'Inclínate hacia atrás sobre el borde del respaldo hasta donde sea cómodo, mantén 3–5 segundos y vuelve. Repite 5 veces.',
        'Desplázate un poco en la silla para apoyar otra zona de la espalda alta y repite 5 veces más.',
        'Respira con normalidad durante todo el ejercicio y detente si sientes un dolor punzante.'
      ],
      en: [
        'Sit at the back of a stable chair with a firm backrest. If it has wheels, lock it or brace it against the desk.',
        'Interlace your hands behind your neck with your elbows pointing forward.',
        'Lean back over the top of the backrest as far as is comfortable, hold 3–5 seconds and return. Repeat 5 times.',
        'Shift slightly in the chair to rest a different part of your upper back on the backrest and repeat 5 more times.',
        'Breathe normally throughout and stop if you feel sharp pain.'
      ]
    }
  },
  {
    id: 'breath-1',
    title: 'Box Breathing',
    description: 'Tactical breathing for high-stress moments.',
    duration: '75s',
    durationSeconds: 75,
    icon: 'air',
    category: 'Focus',
    neuroBenefit: 'Slow, paced breathing to ease stress and refocus.',
    intensity: 'Low',
    why: {
      es: 'Respirar de forma lenta y con un ritmo regular ayuda a bajar la sensación de estrés y a recuperar la atención en momentos de presión.',
      en: 'Breathing slowly at a steady rhythm helps lower the feeling of stress and regain focus in high-pressure moments.'
    },
    steps: {
      es: [
        'Siéntate cómodo con la espalda recta y exhala todo el aire.',
        'Inhala por la nariz contando 4 segundos y retén el aire otros 4 segundos.',
        'Exhala despacio durante 4 segundos y mantén los pulmones vacíos 4 segundos.',
        'Repite el ciclo 4 veces. Si te mareas, acorta las retenciones a 3 segundos o vuelve a respirar con normalidad.'
      ],
      en: [
        'Sit comfortably with a straight back and breathe all the air out.',
        'Inhale through your nose for 4 seconds and hold for another 4 seconds.',
        'Exhale slowly for 4 seconds and keep your lungs empty for 4 seconds.',
        'Repeat the cycle 4 times. If you feel dizzy, shorten the holds to 3 seconds or return to normal breathing.'
      ]
    }
  },
  {
    id: 'energy-1',
    title: 'Neural Pulse',
    description: 'Light rhythmic shake-out to re-energize body and mind.',
    duration: '1m',
    durationSeconds: 60,
    icon: 'bolt',
    category: 'Energy',
    neuroBenefit: 'Brief movement to counter sedentary sluggishness.',
    intensity: 'Medium',
    why: {
      es: 'Después de mucho tiempo quieto, unos segundos de movimiento rítmico activan la circulación y ayudan a sentirse más despierto antes de volver a la tarea.',
      en: 'After sitting still for a long time, a few seconds of rhythmic movement get the circulation going and help you feel more alert before returning to work.'
    },
    steps: {
      es: [
        'Ponte de pie junto a tu escritorio, con los pies al ancho de los hombros y los ojos abiertos.',
        'Sacude suavemente las manos y los brazos durante 10 segundos, con los hombros sueltos.',
        'Añade un rebote leve en las rodillas, sin saltar, durante 10 segundos más.',
        'Descansa respirando profundo 10 segundos y repite la secuencia una vez más.',
        'Si te sientes inestable o tienes molestias en las rodillas, hazlo sentado moviendo solo brazos y hombros.'
      ],
      en: [
        'Stand next to your desk with your feet shoulder-width apart and your eyes open.',
        'Gently shake your hands and arms for 10 seconds with relaxed shoulders.',
        'Add a light bounce in your knees, without jumping, for 10 more seconds.',
        'Rest with deep breaths for 10 seconds and repeat the sequence once more.',
        'If you feel unsteady or have knee discomfort, do it seated, moving only your arms and shoulders.'
      ]
    }
  },
  {
    id: 'wrist-1',
    title: 'Carpal Glide',
    description: 'Tendon gliding exercises for heavy typing users.',
    duration: '2m',
    durationSeconds: 120,
    icon: 'pan_tool',
    category: 'Decompression',
    neuroBenefit: 'Moves the finger tendons through their full range.',
    intensity: 'Low',
    why: {
      es: 'Teclear durante horas mantiene los dedos en posiciones repetidas. Los deslizamientos tendinosos mueven los tendones de los dedos por todo su recorrido y son un ejercicio habitual para manos que trabajan con teclado.',
      en: 'Typing for hours keeps the fingers in repeated positions. Tendon glides move the finger tendons through their full range and are a common exercise for hands that work at a keyboard.'
    },
    steps: {
      es: [
        'Con el codo flexionado y la muñeca recta, empieza con la mano abierta y los dedos estirados.',
        'Pasa por cada posición manteniéndola 3 segundos: dedos en gancho, puño completo, dedos rectos doblados en los nudillos (mesa) y puño recto con las yemas en la base de la palma.',
        'Vuelve a la mano abierta: eso es una repetición. Haz 4 repeticiones con cada mano.',
        'Muévete despacio y sin forzar. No debe doler; detente si aumenta el hormigueo o el entumecimiento.'
      ],
      en: [
        'With your elbow bent and wrist straight, start with your hand open and fingers extended.',
        'Move through each position, holding it for 3 seconds: hook fist, full fist, straight fingers bent at the knuckles (tabletop) and straight fist with fingertips at the base of the palm.',
        'Return to the open hand: that is one repetition. Do 4 repetitions with each hand.',
        'Move slowly without forcing. It should not hurt; stop if tingling or numbness increases.'
      ]
    }
  }
];