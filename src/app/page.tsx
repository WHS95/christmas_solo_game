"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  return (
    <main className='min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4'>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className='text-center relative'
      >
        <h1 className='text-4xl font-bold text-red-500 mb-4'>
          <span className='text-green-500'>퇴근길</span>
          <br />
          🎄크리스 마스
          <br />
          <span className='text-green-500'>솔로 지키기</span>
          <br />
        </h1>
        <div className='p-6'></div>
        <p className='text-white mb-8'>
          커플들을 피해 <br />
          <span className='text-white'>무사히 집에 돌아가세요!</span>
        </p>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className='px-8 py-3 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition-colors'
          onClick={() => router.push("/game")}
        >
          게임 시작
        </motion.button>

        <div className='absolute bottom-[-80px] left-1/2 transform -translate-x-1/2'>
          <a
            href='https://www.instagram.com/seosawon.95'
            target='_blank'
            rel='noopener noreferrer'
            className='flex items-center text-gray-400 hover:text-gray-300 transition-colors text-sm'
          >
            <svg
              className='w-4 h-4 mr-1'
              fill='currentColor'
              viewBox='0 0 24 24'
            >
              <path d='M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z' />
            </svg>
            <span>@seosawon.95</span>
          </a>
        </div>
      </motion.div>
    </main>
  );
}
