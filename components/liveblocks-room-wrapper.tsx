'use client';

import { useMemo, ReactNode } from 'react';
import { createClient } from '@liveblocks/client';
import { createRoomContext } from '@liveblocks/react';

interface LiveblocksRoomWrapperProps {
    roomId: string;
    collabToken?: string;
    children: (ctx: {
        useRoom: ReturnType<typeof createRoomContext>['useRoom'];
        useOthers: ReturnType<typeof createRoomContext>['useOthers'];
        useSelf: ReturnType<typeof createRoomContext>['useSelf'];
        useStatus: ReturnType<typeof createRoomContext>['useStatus'];
    }) => ReactNode;
}

export function LiveblocksRoomWrapper({
    roomId,
    collabToken,
    children,
}: LiveblocksRoomWrapperProps) {
    const client = useMemo(
        () =>
            createClient({
                authEndpoint: async (room) => {
                    const url =
                        collabToken
                            ? `/api/liveblocks-auth?token=${encodeURIComponent(collabToken)}`
                            : '/api/liveblocks-auth';
                    const response = await fetch(url, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ room }),
                    });
                    if (!response.ok) {
                        const err = (await response.json().catch(() => ({}))) as { error?: string };
                        throw new Error(err.error || 'Failed to authenticate');
                    }
                    return response.json();
                },
                throttle: 16,
            }),
        [collabToken]
    );

    const roomContext = useMemo(() => createRoomContext(client), [client]);
    const { RoomProvider } = roomContext;

    return (
        <RoomProvider id={roomId}>
            {children({
                useRoom: roomContext.useRoom,
                useOthers: roomContext.useOthers,
                useSelf: roomContext.useSelf,
                useStatus: roomContext.useStatus,
            })}
        </RoomProvider>
    );
}
