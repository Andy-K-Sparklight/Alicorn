export const COPYRIGHT_NOTICE = `
@license
            
Copyright (C) 2021-2022 Andy K Rarity Sparklight ("ThatRarityEG")
Copyright (C) 2024 Ted Gao ("skjsjhb")
            
This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.
            
This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <https://www.gnu.org/licenses/>.
`;

export const DEV_SERVER_PORT = 9000;

const isDev = !process.env.NODE_ENV?.includes("prod");

export const buildDefines = {
    "import.meta.env.ALICORN_DEV": JSON.stringify(isDev),
    "import.meta.env.ALICORN_DEV_SERVER_PORT": JSON.stringify(DEV_SERVER_PORT)
};