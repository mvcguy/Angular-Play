using System.Collections.Generic;

namespace ChatAppPoc.Models
{
    public class PublicMessage
    {
        public IDictionary<string, object> Props { get; set; }

        public string Body { get; set; }
    }
}
