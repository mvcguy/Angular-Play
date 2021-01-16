using ChatAppPoc.Models;
using System;
using System.ComponentModel.DataAnnotations;

namespace ChatAppPoc.Data
{
    public class ChatMessage
    {
        [Key]
        public virtual int Id { get; set; }

        public virtual string FromUser { get; set; }

        public virtual string ToUser { get; set; }

        public virtual string Message { get; set; }

        public virtual DateTime CreatedAt { get; set; }

        public bool Seen { get; set; }

        internal ChatMessageVm ToChatMessageVm()
        {
            return new ChatMessageVm
            {
                CreatedAt = CreatedAt,
                FromUser = FromUser,
                ToUser = ToUser,
                Message = Message,
                Index = Id,
                Timestamp = CreatedAt.ToString("t"),
                Seen = Seen
            };
        }
    }
}
