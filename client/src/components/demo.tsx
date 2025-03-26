import { useRef, useState } from "react";

export default function Demo() {
    const [messages, setMessages] = useState<{id: string, message: string}[]>([]);
    const currentIdRef = useRef<string | null>(null);

    const handleMessageChange = ({message, done}: {message: string, done: boolean}) => {
        if (currentIdRef.current) {
            const tempCurrentId = currentIdRef.current;
            setMessages(prev => {
                if (prev.find(m => m.id === tempCurrentId)) {
                    return prev.map(m => m.id === tempCurrentId ? {...m, message: m.message + message} : m);
                }
                return [...prev, {id: tempCurrentId, message}];
            });
        } else {
            const newId = Math.random().toString(36).substring(2, 15);
            currentIdRef.current = newId;
            setMessages(prev => [...prev, {id: currentIdRef.current as string, message}]);
        }
        
        if (done) {
            currentIdRef.current = null;
        }
    }


    
  return <div>Demo</div>;
}
