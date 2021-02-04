using Playground.Properties;
using SharedServices;
using System;
using System.IO;
using System.Text.Json;
using System.Linq;

namespace Playground
{
    class Program
    {
        static void Main(string[] args)
        {
          AudioProcessor.Run(args);
        }
    }

    public static class AudioSamples
    {

        public static void Run()
        {
            //AudioProcessor.Run(args);
            var sample = AudioSamples.GetSample1();
            byte[] rawBytes = new byte[sample.PcmStream.Length * 4];
            //AudioProcessor.GetWaveData(sample.PcmStream, null, ref rawBytes);

            AudioProcessor.GetWaveDataV2(sample.PcmStream, ref rawBytes);

            var max = sample.PcmStream.Select(x => Math.Abs(x)).Max();

            float k = int.MaxValue / max;

            //var s1 = AudioProcessor.BytesToNormalized_16(rawBytes[4], rawBytes[5]);
            var s1 = AudioProcessor.ToFloat(rawBytes, 0, k);
            var s2 = AudioProcessor.ToFloat(rawBytes, 4, k);
            var s3 = AudioProcessor.ToFloat(rawBytes, 8, k);
            var s4 = AudioProcessor.ToFloat(rawBytes, 12, k);

            Console.WriteLine(BitConverter.IsLittleEndian);
        }

        public static ChatStreamVm GetSample1()
        {
            var raw = Resources.AudioSample_1;

            var obj = JsonSerializer.Deserialize<ChatStreamVm>(raw);
            return obj;

        }
    }

    public static class FilesHelper
    {
        public static void Run()
        {
            //var inta = 1032;
            //var intb = 10033;

            //var file = File.Create("test.txt");

            //var wr = new BinaryWriter(file);
            //wr.Write(inta);
            //wr.Write(intb);
            //wr.Dispose();

            //var file2 = File.ReadAllBytes("test.txt");
        }
    }

    public static class LogicalOperatorsHelpers
    {
        public static void Run()
        {
            var n = 0.22638460993766786f;

            var left = AudioSamples.GetSample1().PcmStream;
            var max = left.Select(x => Math.Abs(x)).Max();

            float k = short.MaxValue / max;

            AudioProcessor.NormalizedToBytes_16(n, k, out var a, out var b);

            var nr = AudioProcessor.BytesToNormalized_16(a, b);
        }

        public static void Run2()
        {
            var n = 0.22638460993766786f;

            var max = 0.82638460993766786f;

            float k = int.MaxValue / max;

            var bytes = AudioProcessor.ToBinary(n, k);
            var nr = AudioProcessor.ToFloat(bytes, 0, k);

            var k2 = short.MaxValue / max;
            AudioProcessor.NormalizedToBytes_16(n, k2, out var a, out var b);
            var nr2 = AudioProcessor.BytesToNormalized_16(a, b);

        }
    }
}
