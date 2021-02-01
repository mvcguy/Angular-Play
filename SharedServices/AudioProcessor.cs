using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.IO;
using System.Linq;

namespace SharedServices
{
    public class AudioProcessor
    {
        public static void Run(string[] args)
        {
            // Read header, data and channels as separated data

            // Normalized data stores. Store values in the format -1.0 to 1.0
            byte[] waveheader = null;
            byte[] wavedata = null;

            int sampleRate = 0;

            float[] in_data_l = null;
            float[] in_data_r = null;

            //GetWaveData(@"C:\temp\a2002011001-e02.wav", out waveheader, out wavedata, out sampleRate, out in_data_l, out in_data_r);
            GetWaveData(@"C:\temp\x.wav", out waveheader, out wavedata, out sampleRate, out in_data_l, out in_data_r);

            //
            // Apply Pitch Shifting
            //

            if (in_data_l != null)
                PitchShifter.PitchShift(2f, in_data_l.Length, 1024, 10, sampleRate, in_data_l);

            if (in_data_r != null)
                PitchShifter.PitchShift(2f, in_data_r.Length, 1024, 10, sampleRate, in_data_r);

            //
            // Time to save the processed data
            //

            // Backup wave data
            byte[] copydata = new byte[wavedata.Length];
            Array.Copy(wavedata, copydata, wavedata.Length);

            GetWaveData(in_data_l, in_data_r, ref wavedata);

            //
            // Check if data actually changed
            //

            bool noChanges = true;
            for (int i = 0; i < wavedata.Length; i++)
            {
                if (wavedata[i] != copydata[i])
                {
                    noChanges = false;
                    Console.WriteLine("Data has changed!");
                    break;
                }
            }

            if (noChanges)
                Console.WriteLine("Data has no changes");

            // Save modified wavedata

            string targetFilePath = "sound_low.wav";
            if (File.Exists(targetFilePath))
                File.Delete(targetFilePath);

            using (BinaryWriter writer = new BinaryWriter(File.OpenWrite(targetFilePath)))
            {
                writer.Write(waveheader);
                writer.Write(wavedata);
            }

            Console.ReadLine();
        }

        // Returns left and right float arrays. 'right' will be null if sound is mono.
        public static void GetWaveData(string filename, out byte[] header, out byte[] data, out int sampleRate, out float[] left, out float[] right)
        {
            byte[] wav = File.ReadAllBytes(filename);

            // Determine if mono or stereo
            int channels = wav[22];     // Forget byte 23 as 99.999% of WAVs are 1 or 2 channels

            // Get sample rate
            sampleRate = BitConverter.ToInt32(wav, 24);

            int pos = 12;

            // Keep iterating until we find the data chunk (i.e. 64 61 74 61 ...... (i.e. 100 97 116 97 in decimal))
            while (!(wav[pos] == 100 && wav[pos + 1] == 97 && wav[pos + 2] == 116 && wav[pos + 3] == 97))
            {
                pos += 4;
                int chunkSize = wav[pos] + wav[pos + 1] * 256 + wav[pos + 2] * 65536 + wav[pos + 3] * 16777216;
                pos += 4 + chunkSize;
            }

            pos += 4;

            int subchunk2Size = BitConverter.ToInt32(wav, pos);
            pos += 4;

            // Pos is now positioned to start of actual sound data.
            int samples = subchunk2Size / 2;     // 2 bytes per sample (16 bit sound mono)
            if (channels == 2)
                samples /= 2;        // 4 bytes per sample (16 bit stereo)

            // Allocate memory (right will be null if only mono sound)
            left = new float[samples];

            if (channels == 2)
                right = new float[samples];
            else
                right = null;

            header = new byte[pos];
            Array.Copy(wav, header, pos);

            data = new byte[subchunk2Size];
            Array.Copy(wav, pos, data, 0, subchunk2Size);

            // Write to float array/s:
            int i = 0;
            while (pos < subchunk2Size)
            {

                left[i] = BytesToNormalized_16(wav[pos], wav[pos + 1]);
                pos += 2;
                if (channels == 2)
                {
                    right[i] = BytesToNormalized_16(wav[pos], wav[pos + 1]);
                    pos += 2;
                }
                i++;
            }
        }

        // Return byte data from left and right float data. Ignore right when sound is mono
        public static void GetWaveData(float[] left, float[] right, ref byte[] data)
        {
            // Calculate k
            // This value will be used to convert float to Int16
            // We are not using Int16.Max to avoid peaks due to overflow conversions            
            float k = short.MaxValue / left.Select(x => Math.Abs(x)).Max();

            // Revert data to byte format
            Array.Clear(data, 0, data.Length);
            int dataLenght = left.Length;
            int byteId = -1;
            using (BinaryWriter writer = new BinaryWriter(new MemoryStream(data)))
            {
                for (int i = 0; i < dataLenght; i++)
                {
                    byte byte1 = 0;
                    byte byte2 = 0;

                    byteId++;
                    NormalizedToBytes_16(left[i], k, out byte1, out byte2);
                    writer.Write(byte1);
                    writer.Write(byte2);

                    if (right != null)
                    {
                        byteId++;
                        NormalizedToBytes_16(right[i], k, out byte1, out byte2);
                        writer.Write(byte1);
                        writer.Write(byte2);
                    }
                }
            }
        }

        // Convert two bytes to one double in the range -1 to 1
        static float BytesToNormalized_16(byte firstByte, byte secondByte)
        {
            // convert two bytes to one short (little endian)
            short s = (short)(secondByte << 8 | firstByte);
            // convert to range from -1 to (just below) 1
            return s / 32678f;
        }

        // Convert a float value into two bytes (use k as conversion value and not Int16.MaxValue to avoid peaks)
        static void NormalizedToBytes_16(float value, float k, out byte firstByte, out byte secondByte)
        {
            short s = (short)(value * k);
            firstByte = (byte)(s & 0x00FF);
            secondByte = (byte)(s >> 8);
        }

        public static void SavePcm(ConcurrentQueue<ChatStreamVm> concurrentQueues, AudioHeader header)
        {


            
            var floats = new List<float>();

            while (!concurrentQueues.IsEmpty)
            {
                if (concurrentQueues.TryDequeue(out var result))
                    floats.AddRange(result.PcmStream);
            }

            var size = floats.Count() * 2;
            uint numsamples = (uint)floats.Count();

            byte[] rawData1 = new byte[size];

            GetWaveData(floats.ToArray(), null, ref rawData1);

            //byte[] byte_array = new byte[rawData1.Length * 2];
            //for (int i = 0; i < rawData1.Length; ++i)
            //{
            //    //byte_array[2 * i] = getByte1(rawData1[i]);
            //    //byte_array[2 * i + 1] = getByte2(rawData1[i]);
            //    byte_array[2 * i] = getByte2(rawData1[i]);
            //    byte_array[2 * i + 1] = getByte1(rawData1[i]);
            //}

            var fileName = $"{Guid.NewGuid()}.wav";

            var file = File.Create(fileName);

            var wr = new BinaryWriter(file);


            ushort bitsPerSample = 16;
            char[] chunkId = "RIFF".ToCharArray();

            char[] format = "WAVE".ToCharArray();
            char[] subchunk1Id = "fmt ".ToCharArray();
            uint subChunk1Size = 16;
            ushort audioFormat = 1;
            ushort numchannels = 1;
            uint samplerate = header.SampleRate;
            uint byteRate = (ushort)(samplerate * numchannels * (bitsPerSample / 8));
            ushort blockAlign = (ushort)(numchannels * (bitsPerSample / 8));
            char[] subChunk2Id = "data".ToCharArray();
            uint subChunk2Size = (uint)(numsamples * numchannels * (bitsPerSample / 8));
            uint chunkSize = 36 + subChunk2Size;

            wr.Write(chunkId);          // 4 - offset: 0
            wr.Write(chunkSize);        // 4 : 4
            wr.Write(format);           // 4 : 8
            wr.Write(subchunk1Id);      // 4 : 12
            wr.Write(subChunk1Size);    // 4 : 16
            wr.Write(audioFormat);      // 2 : 20
            wr.Write(numchannels);      // 2 : 22
            wr.Write(samplerate);       // 4 : 24
            wr.Write(byteRate);         // 4 : 28
            wr.Write(blockAlign);       // 2 : 32
            wr.Write(bitsPerSample);    // 2 : 34
            wr.Write(subChunk2Id);      // 4 : 36
            wr.Write(subChunk2Size);    // 4 : 40
            wr.Write(rawData1);         // * : 44
            wr.Dispose();
            file.Dispose();

            var dt = File.ReadAllBytes(fileName);

        }

        public static byte getByte1(short s)
        {
            return (byte)s;
        }

        public static byte getByte2(short s)
        {
            int temp = s >> 8;
            return (byte)temp;
        }

    }
}
