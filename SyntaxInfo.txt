Binomial

--- Natural Number Simulation for Complex Systems ---

    Complex Reaction System Laboratory
    
    Copyright (c) 2022- Takashi Sato
    
    This software is released under the MIT License. http://opensource.org/licenses/mit-license.php*/

Abstract:
   This program provides natural number simulation (NNS) for analyzing complex reaction systems. 
   The numbers in this calculation include the number of molecules, cells, and living individuals, all of which are natural numbers.
   The program includes a time evolution algorithm to compute these natural numbers.  
   This program can be used as a supplement to conventional ordinary differential equation ODEs and Petri nets. 
   NNS simulates chemical reaction systems and mathematical system models by computing random natural numbers with binomial probability. 
   The program allows for convenient model definition through a non-stop computational algorithm. 

Simulation:
   You can simulate the temporal evolution of the “number” of molecules in a reaction system as follows:

   lA + mB + nC + ... → sX + tY + uZ + ...

   Here, A, B, C, X, Y, and Z each represent a reaction element, and l, m, n, s, t, and u represent 
   the stoichiometric coefficients for the reaction. While the details are provided in the paper
   ("Application of a Novel Numerical Simulation to Biochemical Reaction Systems" by Takashi Sato, 
   doi: https://doi.org/10.1101/2023.08.10.552732), it is possible to simultaneously calculate the temporal development expressions 
   with any number of elements and orders for any number of stoichiometric equations as described above.

Categories:
   Complex Systems, Systems Biology, Bioinformatics, A-life, Simulation


1. File Structure

   To run this program, you need the following 9 Python files, one json file, and one input file. 
   Hereafter, these files will be referred to as program files.

   1.1 binomial_v016.py (Main program)
       The main code, which includes the process of reading the input file and executing the calculation.
   1.2 binomial_parameters_02.json
       Contains parameters that decide the conditions for computation and settings for the results.
   1.3 element_35.py
       Contains the code to define the calculation elements. 
       Element objects are created based on element names, initial numbers, etc., 
       defined in the *Element of the input file.
   1.4 reaction_63.py
       Contains the code for calculating reaction formulas. 
       Reaction formulas are defined in *Reaction in the input file.
   1.5 utility_55.py
       Contains utility-related code, such as for outputting result graphs and writing to csv files.
   1.6 setting_30.py
       Contains code related to reading the input file.
   1.7 utility_functions.py
       Contains functions necessary for settings.
   1.8 polymer_12.py
       Under construction.
   1.9 setManage_01.py
       Under construction.

   These codes were created as of September 2023 on Spyder IDE 5.4.3 running on Ubuntu 22.04.2 LTS. 
   The program is operable on both Windows and Linux (however, some input files are only compatible with Linux).
   In addition to these files, binimial_v016.zip contains input files and their execution results.
  

2. Folders and files Preparation

   Create a single main folder. Inside this main folder, create a folder for the programs and store the aforementioned program files in it. 
   Additionally, create another folder within the main folder for input files, and store your input files there(refer to: "Folder_structure.pdf"). 
   You may create as many input file folders as you wish, but please ensure not to create multiple input files with the same name.


3. Input File Structure 1

   This program can be executed by preparing the program files mentioned above along with a single input file. 
   The input file should be written in plain text with a .txt extension and should include four sections: *Time, *Element, *Reaction, and *Plot.
   The description below pertains to the test file inp_immune_323.txt.
   Here, we provide explanations for the four sections: *Time, *Element, *Reaction, and *Plot. 
   Note that in all cases below, ** indicates a comment line.

   3.1 *Time

      Here, you should write the start and end times, as well as set the intervals for console output, plot output, CSV file output, and specify the unit. 
      Only natural numbers, including 0, are available for these values. Calculations are executed at each unit interval. 
      In the example provided, calculations are executed one by one from 0 to 14400. 
      Intermediate results are output to the console every 1440 units, plots are displayed every 7200 units, 
      and values of elements are output to a file every 1400 units. The unit in this case is "min", 
      but please pay attention to the relationship with the rate constant, as it is specified by the user. 
           
         Format:
           *Time
            start time, end time, console out interval, plot out interval, csv-file out interval, time unit
         
         Example:
           *Time, 
           ** start, end, console out, plot out, csv out, time unit
                  0, 14400, 1440, 7200, 1440,  min

   3.2 *Element

      This section is for describing the elements you want to simulate. 4
      At a minimum, you need to specify the element's name and its initial count. 
      Ensure that element names are unique and do not overlap. Additionally, as shown in the example below, 
      the initial count of the elements must be set as a natural number, including 0. 
      However, exponential notation, such as 1e5 or 1.1e4, is also acceptable.
      Additionally, you can set the color and marker for plotting. If you do not specify a color or marker, 
      arbitrary ones will be assigned. For colors, you can set values such as 

         ['Black', 'Green', 'Yellow', 'Gray', 'Blue', 'Red', 'Orange'], or any color from matplotlib.colors.cnames.

      For markers, you can set values from the following options:

         ["o", "v", "^", "<", ">", "1", "2", "3", "4", "8", "s", "p", "*", "h", "H", "+", "x", "D", "d", "|", "_"].
           
         Format:
           *Element
            element name, initial number, plot color, plot marker
               --- --- --- 
               --- --- --- 

         Example:
           *Element
           ** 0:element name, 1:initial number, 2:plot color, 3:plot marker
           virus, 500, Black, 8
           cell, 100000, Green, s
           virusCell, 0, 
           macrophage, 5000, 
           macrophageActive, 0,
           macrophageWithVirus, 0, 
           dendricCell, 2000, Blue,  
           dendricMHC, 0, Red,  
           naiveTh1, 10000, Green
           activeTh1, 0, 
           IFN, 0, Blue
           IL-12, 0


   3.3 *Reaction
       This section defines the reactions between the elements mentioned above, or reactions involving individual elements. 
       Various types of reactions are available for use, as shown below. 
       Reaction Multi (rM) allows for the definition of reactions involving a variety of element types.

          r1_0: A certain percentage decrease of one type of element
          r1_1: One type of element transforms into another single element
          r1_2: One type of element transforms into two different types of elements
          r1_3: One type of element transforms into three different types of elements
          r2_1: Two types of elements transform into one different element
          r2_2: Two types of elements transform into two different types of elements
          r2_3: Two types of elements transform into three different types of elements
          r3_1: Three types of elements transform into one different element
          r3_2: Three types of elements transform into two different types of elements
          r3_3: Three types of elements transform into three different types of elements
          rM:     A variety of elements transform into another variety of elements
          r1_+: The count of one type of element increases linearly
          r1_-: The count of one type of element decreases linearly
          r+-=: The element to the left of the "=" is used to calculate the sum of the multiplication of the coefficient and the number of elements,
                and the result is assigned to the element to the right (used for verification, etc.).


       For reaction definitions, you typically need information about the reactant and product elements, 
       their stoichiometric coefficients, and the numeric setting of the rate constant. 
       For reactions r1_1 and above (from r1_1 to rM as mentioned above), 
       the reactant and product elements can include the same elements. Here’s how to describe them:

       For example, in reaction r1_2, one type of element A transforms into two different types of elements X and Y. 
       If we assume that one A turns into two X’s and three Y’s, the definition would look like this:

          r1_2, 001, 1, A, 0.5, 2, X, 3, Y

       The first term defines the reaction type. 
       The second is an identifier; together with the first term, they create a unique reaction name like "r1_2_001", 
       so ensure there are no duplicates. The third and fourth terms "1, A" specify the stoichiometric coefficient and 
       the reactant element name. The fifth term, 0.5, is the rate constant. 
       The sixth and seventh terms "2, X" and the eighth and ninth terms "3, Y" specify the stoichiometric coefficients and 
       the names of the product elements.
       Stoichiometric coefficients must be natural numbers. The element names must be defined in the *Element section. 
       The probability parameter can be a decimal or a natural number.
       The "rM" allows for the definition of reactions with multiple element types before and after the reaction. 
       For example, a reaction can be defined using three lines like this:

          rM, 002, 1, A, 10, B, 10, C, 2, D, 100, E
                   1000
                   1, X, 1, Y, 10, Z, 3, W

       This defines a reaction where five types of elements react to produce four types of elements. 
       The numbers before the element names are the stoichiometric coefficients, similar to other reactions. 
       The first line defines the reactant elements, the second line is the rate constant, 
       and the third line defines the product elements. This way, many elements can be described in a line, 
       with virtually no limitations.
       In the *Reaction definition, a normalization parameter is required on the same line. 
       Ideally, this value should be around the same magnitude as the total number of elements in the reaction system, 
       but there are no strict limitations. A larger value results in a smaller probability of the reaction occurring, 
       while a smaller value increases the probability. Reactions like r2_1, r2_2, r2_3, r3_1, r3_2, r3_3, and 
       rM are influenced by the normalization parameter through the algorithm, 
       in conjunction with the rate constant.
       ("Application of a Novel Numerical Simulation to Biochemical Reaction Systems" by Takashi Sato, doi: 
       https://doi.org/10.1101/2023.08.10.552732)
       Both the rate constant and the normalization parameter can be decimals. 
       In the format below, A, B, X, and Y are element names defined in the *Element section, and pi (p1, p2, etc.) represents 
       the probability parameters for each reaction.

         Format:
          *Reaction, global normalization parameter
           r1_2, name, a, A,       p1, x, X, y, Y
           r1_1, name, a, A,       p2, x, X
           r1_0, name, a, A,       p3
           r2_2, name, a, A, b, B, p4, x, X, y, Y
           r2_1, name, a, A, b, B, p5, x, X
           rM,   name, a, A, b, B, c, C, d, D, e, E, -------
                       p6
                       x, X, y, Y, z, Z, w, W, -------
           --- --- --- 
           --- --- --- 

         Example:
           *Reaction, 100000000
           r2_1, 001,  10, virus,      1, cell,      0.04, 1, virusCell
           r1_1, 002,   1, virusCell,               0.001, 100, virus
           r2_1, 003,   1, macrophage, 1, virus,      0.9, 1, macrophageWithVirus
           rM,   004,   1, macrophageWithVirus 
                        0.9
                        1, macrophageWithVirus, 10, IFN, 10, IL-12
           r1_1, 005,   1, macrophageWithVirus,       0.1, 1, macrophage
           r2_1, 006,   1, virus, 1, dendricCell,      10, 1, dendricMHC
           rM,   007,   1, naiveTh1,   1, dendricMHC, 10, IFN, 10, IL-12
                        10000
                        1, activeTh1,  1, dendricMHC
           r1_2, 013,   1, activeTh1,                   1, 10, IFN, 1, activeTh1
           r2_1, 014,   1, macrophage, 2, IFN,         10, 1, macrophageActive 
           r2_1, 015,   1, macrophageActive, 10, virus, 1, 1, macrophageWithVirus
           r1_1, 018,   1, dendricMHC,             0.0002, 1, dendricCell
           r1_1, 019,   1, macrophageActive,        0.002, 1, macrophage
           r1_1, 020,   1, activeTh1,               0.001, 1, naiveTh1
           r1_0, 021,   1, IFN, 0.01
    
   3.4 *Plot

      In this section, you define the plotting conditions. 
      Elements written on the same line will be displayed in a single graph. 
      The type of vertical axis for the plot can be either linear or logarithmic. 
      If not specified, it will be displayed as "linear" by default.
      This allows you to visually organize and analyze the results of your simulation, 
      ensuring that all necessary elements are displayed together and in the appropriate format.  

         Format:
          *Plot, plot-type (linear or log)
          ** second item is "linear" or "log".
           A, X, Y
           B, W
           F
           --- --- --- 
           --- --- ---    
        
         Example:
           *Plot
           virus, virusCell, macrophageWithVirus
           cell, virusCell
           macrophage, macrophageActive, macrophageWithVirus
           dendricMHC, dendricCell
           IFN, IL-12
           activeTh1, naiveTh1
           
   3.5 binomial_parameter_02.json

      In this file, you can define five parameters:
         "EntropyCalc": "YES" or "NO": The calculation of entropy can be switched off since it is computationally intensive for large numbers.
                                       Select "YES" to calculate or "NO" to not calculate.
         "CSV_OUTPUT": "YES" or "NO":  All the element values at specified times will be outputted in a CSV file. 
                                       Select "YES" to calculate or "NO" to not calculate.
         "FIG_OUTPUT": "YES" or "NO":  The file type for figures is png. The figures defined in *Plot will be outputted at specified times. 
                                       Select "YES" to calculate or "NO" to not calculate.
         "RestartFile": "YES" or "NO": If "YES", a restart file is created with the last calculated value of the element as the initial value.
                                       For example, for test_059.txt, test_059_Re.txt is created in the same folder as the input file.
                                       If "NO" is selected, no file is created.
         "ProcessPoolExecutor": "NO":  Currently, this is not set up.                             
              

4. Structure of the Input File 2 (Optional Settings) (Example: test_059.txt)

   4.1 *ElementInOut

      An *ElementInOut has been created to represent the inflow and outflow of elements with respect to the computational domain. 
      This allows for the representation of element inflow and outflow during the computation.

         Format:    
         *ElementInOut
          element name, initial number, plot color, marker, <brank>, type-0, at time, amaunt, at time, amaunt, -> -> 
          element name, initial number, plot color, marker, <brank>, type-1, interval, amaunt
          element name, initial number, plot color, marker, <brank>, type-2, const, amplitude, period-time, add-interval
           --- --- --- 
           --- --- ---   
        
         Example:
         *ElementInOut
          Q,      270, blue, s, ,    type-0, 10, 300, 40, 100, 50, 50, 60, 500, 70, 500
          T-in,     0, blue, h, ,    type-1, 2, 1e2
          T-out,  1e5, magenta, 4, , type-1, 2, -5e2
          B,        0,  purple, 2, , type-2, 100, 10, 10,  50
 
        
5. Execution of the Program

   Two execution processes are available. One is to run the program directly from Spyder, 
   and the other is to run it from the command line.

   5.1 Spyder:

      Prepare input files with reference to "2. Folders and files Preparation".
      One way to run the program is to use Spyder from Anaconda3. Open the main program file binomial_v016.py in Spyder. 
      Write the input file name in the appropriate line as follows. 
      The main program already has 'fName' written in it, so please replace it with the name of your input file.

         fName = 'inp_immune_323.txt'

      Run the computation using Spyder's "Run File" command. 
      A new folder will be created in the directory where the input file is located, and the result files will be placed inside it.

   5.2 Command Line, Terminal:

      The folder preparation is the same as in the Spyder case. 
      Open a terminal (for example, Anaconda Powershell Prompt) and change the directory to where the program file is located. 
      Enter the following command line in the terminal:

         > python binomial_v016.py inp_immune_323.txt

      Press Enter to start the program. The result files will be placed in a newly created folder, just like in the Spyder case.


6. Result File

   A result file folder is created in the same directory as the input file. For example:
   "inp_immune_323_yyyy-mm-dd hh-mm-ss" will contain the result files for inp_immune_323.txt.
   In this folder, plotting figures of the time series of element numbers defined in the input file are saved as PNG files. 
   Additionally, CSV files are also stored. There are three types of CSV files:

      inp_immune_323_all.csv:         Records the numbers of elements at the set time, with time in the rows.
      inp_immune_323_all_02.csv:      Records the numbers of elements at the set time, with time in the columns.
      inp_immune_323_information.csv: Provides information on the instantaneous reaction (IR), accumulated IR, and
                                      reaction entropy at the set time, with time in the rows.


7. conversion of SBML files to text files for NNS

   Using convert_SBML_to_NNS_004.py, you can convert an xml file written in SBML into a text file for NNS.
   There are two ways to run the program. In both cases, the file to be changed and the program should be placed in the same folder.
   The program files and some examples can be found in the "convert" folder.

  7.1 Spyder

      One way to run it is to use Spyder with anaconda3. Open convert_SBML_to_NNS_004.py from Spyder.
      Assign the name of the file you want to convert to filename.

         filename = "binding_A_B.xml"

      Run the calculation with Spyder's "Run File" command. 
      The resulting file will be placed in the same holder as shown below.

         binding_A_B_NNS.txt

  7.2 Command line, terminal

      Open a terminal (e.g., Anaconda Powershell Prompt) and change the directory to the directory containing the program files.
      Write a command line in the terminal as follows

         > python convert_SBML_to_NNS_004.py binding_A_B.xml

      After a new line is created and executed, the following files will be created in the same folder.

         binding_A_B_NNS.txt

  7.3 Setup Matters

      The following items can be changed in the program when executing the above.
      (It can also be changed by directly rewriting the output text file)

      7.3.1 The settings related to the calculation time will contain the following lines by default.

              TIME_SCHEDULE = "0, 100, 10, 50, 1, seconds \n\n"

            If you want to change it, modify the output file or change TIME_SCHEDULE in the program.
            The syntax is the same as *Time.

      7.3.2 Attempts to set the initial number of elements, which by default is taken from SBML. If successful, the value is set as is.
            If not, 999 is set. The settings at this time are as follows.
            Note, however, that NNS requires the number of elements to be a positive integer containing 0, 
            so if you read in a decimal number, the program will stop with an error.

              ELEMENT_SETTING = "NO"
              INITIAL_NUMBERS = 999

            The following settings will force the assignment of the specified INITIAL_NUMBERS.

              ELEMENT_SETTING = "YES"
              INITIAL_NUMBERS = 999

            INITIAL_NUMBERS can be changed, but should be 0 or a positive integer. Also, this setting applies to all elements.
            If you want to change it individually, modify the output text file.
            Also, plot colors and markers are set randomly in NNS. If you want to use a specific one, please change the text file as well.

      7.3.3 Reaction expressions are attempted to be obtained from the SBML on a priority basis. 
            If the order of each element of the reaction cannot be successfully retrieved, then 1 is assigned.
            Also, if the rate constants cannot be successfully retrieved, the following constants are assigned.

              RATE_CONSTANT = 999

            In addition, the normalization constants is NNS's own constants, so they are assigned as follows,

              NORMALIZATION_CONSTANT = 9.9e9

            It is recommended that each of the above constants be changed appropriately 
            according to the nature of the system and the characteristics of the reaction.

      7.3.4 The default for *Plot is to describe all of each element taken from SBML, with NUMBER_TO_PLOT.
            NUMBER_TO_PLOT allows you to specify the number of elements in a single graph. 
            If you do not want any output, set PLOT_CONDITION = "NO".

              PLOT_CONDITION = "YES" 
              NUMBER_TO_PLOT = 5
            













