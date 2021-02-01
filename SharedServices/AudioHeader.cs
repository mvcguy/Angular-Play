namespace SharedServices
{
    public class AudioHeader
    {
        public uint SampleRate { get; set; }

        public uint SampleSize { get; set; }

        public AudioHeader()
        {
            SampleRate = 44100;
            SampleSize = 1024;
        }
    }

    public class ChatStreamVm
    {
        public string FromUser { get; set; }

        public string ToUser { get; set; }

        public float[] PcmStream { get; set; }
    }
}