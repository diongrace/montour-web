import { useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';

const WS_URL = import.meta.env.VITE_WS_URL ?? 'ws://localhost:8080/ws';

/**
 * S'abonne à un canal WebSocket STOMP tant que le composant est affiché.
 * - onMessage(message) : appelé à chaque message reçu (déjà converti en objet).
 * - onConnexion() : appelé à chaque (re)connexion, pour recharger l'état à jour.
 * La reconnexion est automatique toutes les 3 secondes si le réseau coupe.
 */
export function useTopic(topic, onMessage, onConnexion) {
  const messageRef = useRef(onMessage);
  const connexionRef = useRef(onConnexion);

  useEffect(() => {
    messageRef.current = onMessage;
    connexionRef.current = onConnexion;
  });

  useEffect(() => {
    if (!topic) return undefined;

    const client = new Client({ brokerURL: WS_URL, reconnectDelay: 3000 });
    client.onConnect = () => {
      client.subscribe(topic, (message) => messageRef.current?.(JSON.parse(message.body)));
      connexionRef.current?.();
    };
    client.activate();

    return () => {
      client.deactivate();
    };
  }, [topic]);
}
