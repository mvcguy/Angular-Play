using SharedServices;
using System;
using System.IO;

namespace Playground
{
    class Program
    {
        static void Main(string[] args)
        {
            AudioProcessor.Run(args);
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
}
