using ChatAppPoc.Data;
using System;
using System.Collections.Generic;

namespace ChatAppPoc.Models
{
    public class ChatMessageVm
    {
        /* 
         * //client side
            class ChatMessage {
                userName?: string;
                message?: string;
                timestamp?: string;
                index?: number;
            }
         */

        public string FromUser { get; set; }

        public string ToUser { get; set; }

        public string Message { get; set; }

        public DateTime CreatedAt { get; set; }

        /// <summary>
        /// time at user machine when message was sent
        /// </summary>
        public string Timestamp { get; set; }

        public int Index { get; set; }

        public bool Seen { get; set; }

        internal PublicMessage ToPublicMessage()
        {
            return new PublicMessage
            {
                Props = new Dictionary<string, object>
                {
                    {nameof(CreatedAt), DateTime.Now },
                    {nameof(FromUser), FromUser },
                    {nameof(ToUser), ToUser },
                    {nameof(Index), Index },
                    {nameof(Timestamp), Timestamp },
                    {nameof(Seen), Seen }
                },
                Body = Message
            };
        }

        internal ChatMessage ToDbMessage()
        {
            return new ChatMessage
            {
                CreatedAt = DateTime.Now,
                FromUser = FromUser,
                ToUser = ToUser,
                //Message = HtmlEncoder.Default.Encode(Message)
                Message = Message // TODO: use whitelisting
            };
        }
    }
}
